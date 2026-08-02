import { useCallback, useRef } from 'react';
import { GridApi, Column } from 'ag-grid-community';

interface UseFoxProKeyboardOptions {
  gridApi: GridApi | null;
  editableColumns: string[];
  rowData: any[];
  onAppendRow: () => void;
  onF4Search?: (row: any, colKey: string) => void;
  onF12Save?: () => void;
  disabled?: boolean;
}

export const useFoxProKeyboard = ({
  gridApi,
  editableColumns,
  rowData,
  onAppendRow,
  onF4Search,
  onF12Save,
  disabled = false,
}: UseFoxProKeyboardOptions) => {
  const editableColsRef = useRef(editableColumns);
  editableColsRef.current = editableColumns;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gridApi || disabled) return;

      // Do not intercept if focus is inside an input element outside the AG Grid
      const isOutsideInput =
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT') &&
        !document.activeElement.closest('.foxpro-grid');

      if (isOutsideInput) return;

      const focusedCell = gridApi.getFocusedCell();
      if (!focusedCell) return;

      const { rowIndex, column } = focusedCell;
      const colKey = column.getColId();
      const cols = editableColsRef.current;
      const colIndex = cols.indexOf(colKey);
      const totalRows = gridApi.getDisplayedRowCount();

      // F12 -> Save
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        gridApi.stopEditing(false);
        if (onF12Save) onF12Save();
        return;
      }

      // F4 -> Trigger Search Modal
      if (e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
        gridApi.stopEditing(false);
        const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
        if (onF4Search && rowNode) {
          onF4Search(rowNode.data, colKey);
        }
        return;
      }

      // F2 -> Edit Toggle
      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        gridApi.startEditingCell({ rowIndex, colKey });
        return;
      }

      // Enter key navigation logic
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();

        // Stop editing current cell
        gridApi.stopEditing(false);

        // Calculate next cell position
        if (colIndex !== -1 && colIndex < cols.length - 1) {
          // Move right to next editable column in same row
          const nextColKey = cols[colIndex + 1];
          gridApi.setFocusedCell(rowIndex, nextColKey);
          gridApi.startEditingCell({ rowIndex, colKey: nextColKey });
        } else {
          // We are at the last column of current row -> Wrap to first column of next row
          const firstColKey = cols[0] || colKey;
          if (rowIndex < totalRows - 1) {
            const nextRowIndex = rowIndex + 1;
            gridApi.setFocusedCell(nextRowIndex, firstColKey);
            gridApi.startEditingCell({ rowIndex: nextRowIndex, colKey: firstColKey });
          } else {
            // At last column of last row -> Append new row
            onAppendRow();
            setTimeout(() => {
              const newTotalRows = gridApi.getDisplayedRowCount();
              const newRowIndex = newTotalRows - 1;
              gridApi.setFocusedCell(newRowIndex, firstColKey);
              gridApi.startEditingCell({ rowIndex: newRowIndex, colKey: firstColKey });
            }, 50);
          }
        }
        return;
      }

      // Down Arrow on last row -> Append new row
      if (e.key === 'ArrowDown' && rowIndex === totalRows - 1) {
        onAppendRow();
        setTimeout(() => {
          gridApi.setFocusedCell(totalRows, colKey);
        }, 50);
        return;
      }
    },
    [gridApi, onAppendRow, onF4Search, onF12Save]
  );

  return { handleKeyDown };
};
