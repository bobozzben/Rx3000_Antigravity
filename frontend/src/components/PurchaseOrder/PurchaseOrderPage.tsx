import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ColDef } from 'ag-grid-community';
import { FoxProGrid } from '../FoxProGrid/FoxProGrid';
import { SearchModal, SearchItem } from '../FoxProGrid/SearchModal';
import { api, Vendor, PurchaseLine } from '../../services/api';
import { Save, RefreshCw, Search, FileText, CheckCircle, AlertCircle, Calendar, Building2 } from 'lucide-react';

export const PurchaseOrderPage: React.FC = () => {
  // Header State
  const [docType, setDocType] = useState('A101 - 進貨單');
  const [billNo, setBillNo] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);

  // Vendor F4 Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorResults, setVendorResults] = useState<SearchItem[]>([]);

  // Notification / Alert message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize 15 empty rows for default FoxPro grid experience
  const createEmptyRows = (): PurchaseLine[] => {
    return Array.from({ length: 15 }, (_, idx) => ({
      lineNo: idx + 1,
      productCode: '',
      productName: '',
      spec: '',
      qty: 0,
      price: 0,
      amount: 0,
      remarks: '',
    }));
  };

  const [gridRows, setGridRows] = useState<PurchaseLine[]>(createEmptyRows());

  // Load next Bill Number on mount
  const fetchNextBillNo = useCallback(async () => {
    try {
      const newBillNo = await api.getNextBillNo();
      setBillNo(newBillNo);
    } catch (err) {
      console.error('Failed to fetch next bill number:', err);
    }
  }, []);

  useEffect(() => {
    fetchNextBillNo();
  }, [fetchNextBillNo]);

  // Vendor Lookup by Code
  const handleVendorCodeBlur = async () => {
    if (!vendorCode.trim()) {
      setVendorName('');
      return;
    }
    try {
      const vendors = await api.searchVendors(vendorCode);
      if (vendors.length > 0) {
        setVendorCode(vendors[0].code);
        setVendorName(vendors[0].name);
      } else {
        setToastMessage({ type: 'error', text: `找不到廠商代號 ${vendorCode}` });
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
    }
  };

  // Vendor F4 Modal Search Trigger
  const handleVendorSearchF4 = async () => {
    setVendorQuery(vendorCode);
    const results = await api.searchVendors(vendorCode);
    setVendorResults(results);
    setIsVendorModalOpen(true);
  };

  const handleVendorSelect = (item: SearchItem) => {
    setVendorCode(item.code);
    setVendorName(item.name);
    setIsVendorModalOpen(false);
  };

  const handleVendorSearchChange = async (q: string) => {
    setVendorQuery(q);
    const results = await api.searchVendors(q);
    setVendorResults(results);
  };

  // Define AG Grid Column Definitions
  const columnDefs: ColDef[] = [
    {
      headerName: '列號',
      field: 'lineNo',
      width: 70,
      editable: false,
      cellClass: 'text-center font-bold bg-gray-100 text-gray-700',
    },
    {
      headerName: '產品代號 (F4)',
      field: 'productCode',
      width: 150,
      editable: true,
      cellClass: 'font-bold text-blue-900',
    },
    {
      headerName: '品名',
      field: 'productName',
      flex: 2,
      editable: false,
      cellClass: 'font-bold text-gray-900',
    },
    {
      headerName: '規格',
      field: 'spec',
      width: 120,
      editable: false,
      cellClass: 'text-gray-600',
    },
    {
      headerName: '數量',
      field: 'qty',
      width: 100,
      editable: true,
      type: 'numericColumn',
      valueFormatter: (params) => (params.value ? Number(params.value).toString() : '0'),
      cellClass: 'text-right font-bold text-blue-900',
    },
    {
      headerName: '單價',
      field: 'price',
      width: 120,
      editable: true,
      type: 'numericColumn',
      valueFormatter: (params) => (params.value ? `$${Number(params.value).toFixed(2)}` : '$0.00'),
      cellClass: 'text-right font-mono font-bold text-green-800',
    },
    {
      headerName: '小計',
      field: 'amount',
      width: 140,
      editable: false,
      type: 'numericColumn',
      valueFormatter: (params) => (params.value ? `$${Number(params.value).toFixed(2)}` : '$0.00'),
      cellClass: 'text-right font-mono font-bold bg-yellow-50 text-red-700',
    },
    {
      headerName: '備註',
      field: 'remarks',
      flex: 1,
      editable: true,
      cellClass: 'text-gray-700',
    },
  ];

  // Save Purchase Order (F12 or Button Click)
  const handleSavePurchaseOrder = async (currentRows: any[] = gridRows) => {
    // Filter valid lines with productCode
    const validLines = currentRows.filter((r) => r.productCode && r.productCode.trim() !== '');

    if (!vendorCode.trim()) {
      setToastMessage({ type: 'error', text: '請輸入或選擇廠商代號 (F4)' });
      return;
    }

    if (validLines.length === 0) {
      setToastMessage({ type: 'error', text: '請至少輸入一筆明細產品！' });
      return;
    }

    const totalAmount = validLines.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const payload = {
      header: {
        billNo,
        vendorCode,
        vendorName,
        total: Number(totalAmount.toFixed(2)),
      },
      lines: validLines.map((line, idx) => ({
        lineNo: idx + 1,
        productCode: line.productCode,
        productName: line.productName,
        spec: line.spec || '',
        qty: Number(line.qty) || 0,
        price: Number(line.price) || 0,
        amount: Number(line.amount) || 0,
        remarks: line.remarks || '',
      })),
    };

    try {
      await api.savePurchaseOrder(payload);
      setToastMessage({ type: 'success', text: `進貨單 [${billNo}] 存檔成功！` });
      
      // Reset page with new bill number
      setTimeout(() => {
        setGridRows(createEmptyRows());
        setVendorCode('');
        setVendorName('');
        fetchNextBillNo();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving order:', err);
      const errMsg = err.response?.data?.error || '存檔失敗，請檢查後端服務！';
      setToastMessage({ type: 'error', text: errMsg });
    }
  };

  // Keyboard shortcut listener for F9 Query & Global shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        alert('F9 歷史單據查詢功能');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const totalAmount = gridRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col font-mono p-4">
      {/* Top System Header Banner */}
      <header className="bg-blue-950 border-b-4 border-yellow-500 p-4 rounded-t-xl shadow-2xl flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500 rounded-lg text-blue-950 font-black text-xl shadow-inner">
            Rx3000
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">進貨單資料輸入系統</h1>
            <p className="text-xs text-blue-300">FoxPro 高速鍵盤盲打模組 (全鍵盤支援免滑鼠)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSavePurchaseOrder()}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold rounded-lg shadow-lg text-lg transition-all"
          >
            <Save className="w-5 h-5 text-yellow-300" />
            存檔 (F12)
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {toastMessage && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center justify-between font-bold text-base shadow-lg animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-green-600 text-white border-2 border-green-300'
              : 'bg-red-600 text-white border-2 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-yellow-300" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs underline hover:text-yellow-200"
          >
            關閉
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-slate-800 border-2 border-blue-700 rounded-xl p-5 shadow-2xl flex-1 flex flex-col gap-4">
        {/* Header Fields Section */}
        <div className="bg-slate-900 border-2 border-blue-900 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
          {/* Doc Type */}
          <div>
            <label className="block text-xs text-blue-400 font-bold mb-1">單別</label>
            <div className="flex items-center gap-2 bg-slate-800 border border-blue-600 rounded px-3 py-2 text-yellow-300 font-bold text-base">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{docType}</span>
            </div>
          </div>

          {/* Bill No */}
          <div>
            <label className="block text-xs text-blue-400 font-bold mb-1">單號 (自動編號)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={billNo}
                className="w-full bg-slate-800 border-2 border-blue-600 rounded px-3 py-1.5 text-yellow-300 font-bold text-lg font-mono focus:outline-none"
              />
              <button
                onClick={fetchNextBillNo}
                title="重新產生單號"
                className="p-2 bg-blue-700 hover:bg-blue-600 rounded text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vendor Code */}
          <div>
            <label className="block text-xs text-yellow-400 font-bold mb-1">
              廠商代號 (按 F4 開啟搜尋)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
                onBlur={handleVendorCodeBlur}
                onKeyDown={(e) => {
                  if (e.key === 'F4') {
                    e.preventDefault();
                    handleVendorSearchF4();
                  }
                }}
                placeholder="輸入代號或按 F4"
                className="w-full bg-yellow-100 text-black border-2 border-yellow-500 rounded px-3 py-1.5 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={handleVendorSearchF4}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold rounded flex items-center gap-1 text-sm"
              >
                <Search className="w-4 h-4" />
                F4
              </button>
            </div>
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-xs text-blue-400 font-bold mb-1">廠商名稱</label>
            <div className="flex items-center gap-2 bg-slate-800 border border-blue-600 rounded px-3 py-2 text-white font-bold text-base truncate">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">{vendorName || '未選擇廠商'}</span>
            </div>
          </div>
        </div>

        {/* FoxPro Core Grid Section */}
        <div className="flex-1">
          <FoxProGrid
            columns={columnDefs}
            rowData={gridRows}
            onRowDataChange={(newRows) => setGridRows(newRows)}
            onF12Save={(rows) => handleSavePurchaseOrder(rows)}
          />
        </div>

        {/* Bottom Total & Command Footer Bar */}
        <div className="bg-blue-950 border-2 border-yellow-500 rounded-lg p-4 flex flex-wrap items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <div className="text-xl">
              <span className="text-gray-300 mr-2">應付總金額:</span>
              <span className="text-yellow-400 font-black text-3xl">
                ${totalAmount.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Command Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('F9 查詢歷史單據')}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-yellow-300 font-bold rounded border border-blue-600 flex items-center gap-2 text-base"
            >
              <Search className="w-4 h-4" />
              F9 查詢單據
            </button>
            <button
              onClick={() => handleSavePurchaseOrder()}
              className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-blue-950 font-black text-xl rounded shadow-lg flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              F12 存檔進貨單
            </button>
          </div>
        </div>
      </div>

      {/* Vendor F4 Search Modal */}
      <SearchModal
        isOpen={isVendorModalOpen}
        title="廠商代號 搜尋"
        query={vendorQuery}
        items={vendorResults}
        onSearchChange={handleVendorSearchChange}
        onSelect={handleVendorSelect}
        onClose={() => setIsVendorModalOpen(false)}
      />
    </div>
  );
};
