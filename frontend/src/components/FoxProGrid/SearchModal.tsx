import React, { useState, useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';

export interface SearchItem {
  code: string;
  name: string;
  spec?: string;
  price?: number;
  stock?: number;
  [key: string]: any;
}

interface SearchModalProps {
  isOpen: boolean;
  title: string;
  query: string;
  items: SearchItem[];
  onSearchChange: (q: string) => void;
  onSelect: (item: SearchItem) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  title,
  query,
  items,
  onSearchChange,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus and select input on open
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Auto scroll list as selectedIndex changes
  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      const selectedElem = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation(); // CRITICAL: Stop event from leaking to AG Grid in background

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items.length > 0 && items[selectedIndex]) {
        onSelect(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-white border-4 border-yellow-500 rounded-lg shadow-2xl overflow-hidden font-mono text-black"
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-950 text-white px-4 py-3 flex items-center justify-between border-b-2 border-yellow-500">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-black tracking-wider text-yellow-300">{title} (F4 快速搜尋)</h2>
          </div>
          <span className="text-xs bg-blue-900 px-2 py-1 rounded text-yellow-300 border border-blue-700">
            [↑↓]選擇 [Enter]確定 [Esc]關閉
          </span>
        </div>

        {/* Search Input */}
        <div className="p-3 bg-slate-100 border-b border-gray-300">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-600 rounded-md bg-yellow-100 text-black text-xl font-black focus:outline-none focus:ring-4 focus:ring-yellow-400 shadow-inner"
              placeholder="請輸入代號或名稱關鍵字..."
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              autoFocus
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto divide-y divide-gray-200 bg-white">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-lg font-bold">
              無符合資料，請重新輸入關鍵字...
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.code || idx}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between text-base transition-colors ${
                    isSelected
                      ? 'bg-blue-900 text-white font-black'
                      : 'hover:bg-blue-50 text-gray-900 font-bold'
                  }`}
                  onClick={() => onSelect(item)}
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded text-sm font-black ${
                      isSelected ? 'bg-yellow-400 text-blue-950' : 'bg-gray-200 text-blue-900'
                    }`}>
                      {item.code}
                    </span>
                    <span className="text-lg">{item.name}</span>
                    {item.spec && (
                      <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                        [{item.spec}]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {item.price !== undefined && (
                      <span className={`font-mono text-lg ${isSelected ? 'text-yellow-300 font-black' : 'text-green-700 font-bold'}`}>
                        ${Number(item.price).toFixed(2)}
                      </span>
                    )}
                    {item.stock !== undefined && (
                      <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        庫存: {item.stock}
                      </span>
                    )}
                    {isSelected && <Check className="w-6 h-6 text-yellow-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-200 px-4 py-2 flex justify-between items-center text-xs text-gray-800 border-t border-gray-300 font-bold">
          <span>共 {items.length} 筆結果</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-bold shadow"
          >
            關閉 (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
