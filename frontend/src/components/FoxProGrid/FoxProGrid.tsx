import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
import { useFoxProKeyboard } from './useFoxProKeyboard';
import { SearchModal, SearchItem } from './SearchModal';
import { api } from '../../services/api';

export interface FoxProGridProps {
  columns: ColDef[];
  rowData: any[];
  onRowDataChange: (newRows: any[]) => void;
  onF4?: (row: any, colKey: string) => void;
  onF12Save?: (rows: any[]) => void;
  editableColumns?: string[];
}

export const FoxProGrid: React.FC<FoxProGridProps> = ({
  columns,
  rowData,
  onRowDataChange,
  onF4,
  onF12Save,
  editableColumns = ['productCode', 'qty', 'price', 'remarks'],
}) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTitle, setSearchTitle] = useState('產品搜尋');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [activeTargetCell, setActiveTargetCell] = useState<{ rowIndex: number; colKey: string } | null>(null);

  // Append empty row handler
  const handleAppendRow = useCallback(() => {
    const nextLineNo = rowData.length + 1;
    const newRow = {
      lineNo: nextLineNo,
      productCode: '',
      productName: '',
      spec: '',
      qty: 0,
      price: 0,
      amount: 0,
      remarks: '',
    };
    const updated = [...rowData, newRow];
    onRowDataChange(updated);
  }, [rowData, onRowDataChange]);

  // F4 Triggered Search Handler
  const handleF4Search = useCallback(
    async (row: any, colKey: string) => {
      gridApi?.stopEditing(true);
      const focused = gridApi?.getFocusedCell();
      const rowIndex = focused ? focused.rowIndex : rowData.findIndex((r) => r.lineNo === row.lineNo);
      setActiveTargetCell({ rowIndex: rowIndex >= 0 ? rowIndex : 0, colKey });

      if (colKey === 'productCode' || colKey === 'productName') {
        setSearchTitle('產品代號 / 品名 搜尋');
        const queryVal = row[colKey] || '';
        setSearchQuery(queryVal);
        const results = await api.searchProducts(queryVal);
        setSearchResults(results);
        setIsSearchOpen(true);
      } else if (onF4) {
        onF4(row, colKey);
      }
    },
    [gridApi, rowData, onF4]
  );

  // Internal F12 Handler
  const handleF12SaveInternal = useCallback(() => {
    if (onF12Save) {
      onF12Save(rowData);
    }
  }, [onF12Save, rowData]);

  // Keyboard navigation hook setup
  const { handleKeyDown } = useFoxProKeyboard({
    gridApi,
    editableColumns,
    rowData,
    onAppendRow: handleAppendRow,
    onF4Search: handleF4Search,
    onF12Save: handleF12SaveInternal,
    disabled: isSearchOpen,
  });

  // Attach keydown listener to container window
  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', listener, true);
    return () => {
      window.removeEventListener('keydown', listener, true);
    };
  }, [handleKeyDown]);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    // Focus line 1, first editable column on load
    setTimeout(() => {
      if (params.api.getDisplayedRowCount() > 0) {
        params.api.setFocusedCell(0, editableColumns[0] || 'productCode');
      }
    }, 100);
  };

  // Cell Value Changed Handler (Auto Product Lookup & Amount calculation)
  const handleCellValueChanged = async (event: CellValueChangedEvent) => {
    const { data, colDef, newValue } = event;
    const rowIndex = event.rowIndex;
    if (rowIndex === null || rowIndex === undefined) return;

    const updatedRows = [...rowData];
    const currentRow = { ...updatedRows[rowIndex] };

    // Auto product lookup when productCode is entered
    if (colDef.field === 'productCode' && newValue) {
      try {
        const products = await api.searchProducts(newValue);
        if (products.length > 0) {
          const match = products[0];
          currentRow.productCode = match.code;
          currentRow.productName = match.name;
          currentRow.spec = match.spec;
          currentRow.price = match.price;
          if (!currentRow.qty || currentRow.qty === 0) currentRow.qty = 1;
          currentRow.amount = Number((currentRow.qty * currentRow.price).toFixed(2));
        }
      } catch (err) {
        console.error('Failed to lookup product:', err);
      }
    }

    // Auto amount calculation on Qty or Price edit
    if (colDef.field === 'qty' || colDef.field === 'price') {
      const q = Number(currentRow.qty) || 0;
      const p = Number(currentRow.price) || 0;
      currentRow.amount = Number((q * p).toFixed(2));
    }

    updatedRows[rowIndex] = currentRow;
    onRowDataChange(updatedRows);
  };

  // Search Modal Query Change
  const handleSearchQueryChange = async (q: string) => {
    setSearchQuery(q);
    const results = await api.searchProducts(q);
    setSearchResults(results);
  };

  // Search Modal Item Selected
  const handleSearchSelect = (item: SearchItem) => {
    if (activeTargetCell !== null && activeTargetCell.rowIndex >= 0) {
      const updatedRows = [...rowData];
      const targetRow = { ...updatedRows[activeTargetCell.rowIndex] };

      targetRow.productCode = item.code;
      targetRow.productName = item.name;
      targetRow.spec = item.spec || '';
      targetRow.price = Number(item.price) || 0;
      if (!targetRow.qty || targetRow.qty === 0) targetRow.qty = 1;
      targetRow.amount = Number((targetRow.qty * targetRow.price).toFixed(2));

      updatedRows[activeTargetCell.rowIndex] = targetRow;
      onRowDataChange(updatedRows);

      // Return focus to grid next cell (qty)
      if (gridApi) {
        setTimeout(() => {
          gridApi.setFocusedCell(activeTargetCell.rowIndex, 'qty');
          gridApi.startEditingCell({ rowIndex: activeTargetCell.rowIndex, colKey: 'qty' });
        }, 50);
      }
    }
    setIsSearchOpen(false);
  };

  // Calculations for StatusBar
  const totalAmount = rowData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const validLineCount = rowData.filter((r) => r.productCode && r.productCode.trim() !== '').length;

  const handleCloseSearchModal = () => {
    setIsSearchOpen(false);
    if (gridApi && activeTargetCell) {
      setTimeout(() => {
        gridApi.setFocusedCell(activeTargetCell.rowIndex, activeTargetCell.colKey);
      }, 50);
    }
  };

  return (
    <div className="w-full flex flex-col border-2 border-blue-900 rounded-lg shadow-xl bg-white overflow-hidden">
      {/* AG Grid Container */}
      <div className="ag-theme-alpine foxpro-grid w-full h-[480px]">
        <AgGridReact
          modules={[AllCommunityModule]}
          rowData={rowData}
          columnDefs={columns}
          editType="fullRow"
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={false}
          suppressClickEdit={false}
          suppressRowClickSelection={true}
          suppressCellFocus={false}
          enterNavigatesVertically={true}
          enterNavigatesVerticallyAfterEdit={true}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={100}
          enableCellTextSelection={false}
          suppressScrollOnNewData={true}
          onGridReady={onGridReady}
          onCellValueChanged={handleCellValueChanged}
        />
      </div>

      {/* FoxPro High-Contrast Bottom StatusBar */}
      <div className="bg-blue-950 text-white px-4 py-2 flex flex-wrap items-center justify-between border-t-2 border-blue-800 font-mono text-sm">
        {/* Statistics */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">有效筆數:</span>
            <span className="text-yellow-400 font-bold text-base">{validLineCount} / {rowData.length} 列</span>
          </div>
          <div className="h-4 w-px bg-blue-700" />
          <div className="flex items-center gap-2">
            <span className="text-gray-300">總計金額:</span>
            <span className="text-yellow-300 font-bold text-lg">
              ${totalAmount.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Keyboard Shortcut Hints Bar */}
        <div className="flex items-center gap-3 text-xs bg-blue-900/80 px-3 py-1 rounded border border-blue-700">
          <span className="text-yellow-300 font-bold">[F2] 編輯</span>
          <span className="text-blue-300">|</span>
          <span className="text-yellow-300 font-bold">[F4] 搜尋</span>
          <span className="text-blue-300">|</span>
          <span className="text-yellow-300 font-bold">[F12] 存檔</span>
          <span className="text-blue-300">|</span>
          <span className="text-gray-200">[Enter] 下一格</span>
          <span className="text-blue-300">|</span>
          <span className="text-gray-200">[↑↓] 移動列</span>
        </div>
      </div>

      {/* F4 Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        title={searchTitle}
        query={searchQuery}
        items={searchResults}
        onSearchChange={handleSearchQueryChange}
        onSelect={handleSearchSelect}
        onClose={handleCloseSearchModal}
      />
    </div>
  );
};
