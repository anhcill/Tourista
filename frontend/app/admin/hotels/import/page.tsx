'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaFileCsv, FaMapMarkerAlt,
  FaTimesCircle
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import styles from './page.module.css';

const formatVND = (amount) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('vi-VN').format(num);
};

export default function AdminHotelImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [autoApprove, setAutoApprove] = useState(true);
  const [generateFakePrices, setGenerateFakePrices] = useState(true);
  const [defaultCityId, setDefaultCityId] = useState(1);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv') && selected.type !== 'text/csv') {
      setError('Vui lòng chọn file CSV.');
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError('File quá lớn. Tối đa 50MB.');
      return;
    }

    setFile(selected);
    setError('');
    setParsedRows([]);
    setPreview(null);
    setImportResult(null);
  }, []);

  const handleParseCsv = useCallback(async () => {
    if (!file) {
      setError('Vui lòng chọn file CSV trước.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await adminApi.importHotelsParse(file);
      const rows = response?.data?.data || response?.result || [];
      setParsedRows(rows);

      if (rows.length === 0) {
        setError('Không tìm thấy dữ liệu trong file CSV.');
      } else {
        setStep(2);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'response' in err ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || String(err)) : String(err));
      setError('Lỗi parse CSV: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handlePreview = useCallback(async () => {
    if (parsedRows.length === 0) {
      setError('Không có dữ liệu để preview.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request = {
        rows: parsedRows,
        autoApprove,
        generateFakePrices,
        defaultCityId,
      };
      const response = await adminApi.importHotelsPreview(request);
      setPreview(response?.data?.data || response?.result || null);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'response' in err ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || String(err)) : String(err));
      setError('Lỗi preview: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [parsedRows, autoApprove, generateFakePrices, defaultCityId]);

  const handleImport = useCallback(async () => {
    if (parsedRows.length === 0) {
      setError('Không có dữ liệu để import.');
      return;
    }

    if (!confirm(`Bạn có chắc muốn import ${parsedRows.length} khách sạn vào database?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request = {
        rows: parsedRows,
        autoApprove,
        generateFakePrices,
        defaultCityId,
      };
      const response = await adminApi.importHotelsExecute(request);
      setImportResult(response?.data?.data || response?.result || null);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'response' in err ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || String(err)) : String(err));
      setError('Lỗi import: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [parsedRows, autoApprove, generateFakePrices, defaultCityId]);

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setPreview(null);
    setImportResult(null);
    setStep(1);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/hotels" className={styles.backBtn}>
          <FaArrowLeft /> Quay lại
        </Link>
        <h1 className={styles.title}>Import Khách Sạn từ CSV</h1>
      </div>

      {/* Step Indicator */}
      <div className={styles.steps}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`${styles.step} ${step >= s ? styles.stepActive : ''} ${step === s ? styles.stepCurrent : ''}`}>
            <div className={styles.stepNumber}>{s}</div>
            <span className={styles.stepLabel}>
              {s === 1 ? 'Upload CSV' : s === 2 ? 'Chọn Tùy chọn' : s === 3 ? 'Preview' : 'Kết quả'}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className={styles.errorBox}>
          <FaExclamationCircle /> {error}
          <button onClick={() => setError('')} className={styles.closeError}>×</button>
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <div className={styles.uploadZone}
               onClick={() => fileInputRef.current?.click()}>
            <FaFileCsv className={styles.uploadIcon} />
            <p className={styles.uploadText}>
              {file ? file.name : 'Kéo thả file CSV hoặc click để chọn'}
            </p>
            {file && (
              <p className={styles.uploadInfo}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
          </div>

          <div className={styles.csvFormat}>
            <h3>Yêu cầu định dạng CSV:</h3>
            <p>File CSV phải có các columns: <code>title</code>, <code>address</code>, <code>latitude</code>, <code>longitude</code></p>
            <p>Các columns tùy chọn: <code>category</code>, <code>review_count</code>, <code>review_rating</code>, <code>descriptions</code>, <code>images</code>, <code>thumbnail</code>, <code>phone</code>, <code>website</code></p>
          </div>

          <button
            className={styles.primaryBtn}
            onClick={handleParseCsv}
            disabled={!file || loading}
          >
            {loading ? 'Đang parse...' : 'Parse CSV'}
          </button>
        </div>
      )}

      {/* STEP 2: Options */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <div className={styles.statsBox}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{parsedRows.length}</span>
              <span className={styles.statLabel}>Dòng dữ liệu</span>
            </div>
          </div>

          <div className={styles.optionsCard}>
            <h3>Cấu hình Import</h3>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
              />
              <span>Tự động duyệt khách sạn (APPROVED)</span>
            </label>
            <p className={styles.optionHint}>Nếu bỏ chọn, khách sạn sẽ ở trạng thái PENDING và cần duyệt thủ công.</p>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={generateFakePrices}
                onChange={(e) => setGenerateFakePrices(e.target.checked)}
              />
              <span>Tạo giá ngẫu nhiên cho phòng (Fake Prices)</span>
            </label>
            <p className={styles.optionHint}>Tự động tạo 3-5 loại phòng với giá fake dựa trên rating của khách sạn. Giá sẽ thay đổi mỗi khi được query.</p>

            <div className={styles.selectGroup}>
              <label>Thành phố mặc định (khi không detect được):</label>
              <select
                value={defaultCityId}
                onChange={(e) => setDefaultCityId(Number(e.target.value))}
                className={styles.selectInput}
              >
                <option value={1}>Hà Nội</option>
                <option value={2}>Hồ Chí Minh</option>
                <option value={3}>Đà Nẵng</option>
                <option value={4}>Nha Trang</option>
                <option value={5}>Phú Quốc</option>
                <option value={7}>Hội An</option>
                <option value={10}>Hạ Long</option>
                <option value={12}>Sa Pa</option>
                <option value={58}>Đà Lạt</option>
                <option value={60}>Huế</option>
              </select>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.secondaryBtn} onClick={handleReset}>
              <FaArrowLeft /> Quay lại
            </button>
            <button
              className={styles.primaryBtn}
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? 'Đang preview...' : 'Preview dữ liệu'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview */}
      {step === 3 && preview && (() => {
        const p = preview as Record<string, unknown>;
        const previewRows = (p.previewRows || []) as Record<string, unknown>[];
        const warnings = (p.warnings || []) as string[];
        return (
        <div className={styles.stepContent}>
          <div className={styles.summaryBar}>
            <span><FaCheckCircle className={styles.okIcon} /> {String(p.validRows ?? 0)} hợp lệ</span>
            <span><FaExclamationTriangle className={styles.warnIcon} /> {String(p.skippedRows ?? 0)} bị bỏ qua</span>
            <span>Tổng: {String(p.totalRows ?? 0)} dòng</span>
          </div>

          {warnings.length > 0 && (
            <div className={styles.warningBox}>
              <FaExclamationTriangle /> <strong>Cảnh báo:</strong>
              <ul>
                {warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên khách sạn</th>
                  <th>Địa chỉ</th>
                  <th>Tọa độ</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th>Giá dự kiến</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => {
                  const rowStatus = String(row.status || '');
                  return (
                  <tr key={idx} className={rowStatus === 'SKIP' ? styles.rowSkip : rowStatus === 'WARNING' ? styles.rowWarn : ''}>
                    <td>{String(row.rowNumber ?? '')}</td>
                    <td className={styles.nameCell}>{String(row.name ?? '')}</td>
                    <td className={styles.addressCell}>{String(row.address ?? '-')}</td>
                    <td className={styles.coordCell}>
                      {row.latitude && row.longitude ? (
                        <span>
                          <FaMapMarkerAlt className={styles.mapIcon} />
                          {Number(row.latitude as number).toFixed(4)}, {Number(row.longitude as number).toFixed(4)}
                        </span>
                      ) : (
                        <span className={styles.noCoord}>Không có</span>
                      )}
                    </td>
                    <td>{row.rating ? Number(row.rating as number).toFixed(1) : '-'}/5</td>
                    <td>{formatNumber(row.reviewCount as number)}</td>
                    <td className={styles.priceCell}>
                      {row.fakePrice ? (
                        <span className={styles.fakePrice}>{formatVND(row.fakePrice as number)}</span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles['status' + rowStatus]}`}>
                        {rowStatus === 'OK' ? <><FaCheckCircle /> OK</>
                          : rowStatus === 'WARNING' ? <><FaExclamationTriangle /> Cảnh báo</>
                          : <><FaTimesCircle /> Bỏ qua</>}
                      </span>
                      {typeof row.message === 'string' && row.message ? <div className={styles.rowMsg}>{String(row.message)}</div> : null}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.secondaryBtn} onClick={() => setStep(2)}>
              <FaArrowLeft /> Quay lại
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.importBtn}`}
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? 'Đang import...' : `Import ${p.validRows || 0} khách sạn`}
            </button>
          </div>
        </div>
        );
      })()}

      {/* STEP 4: Result */}
      {step === 4 && importResult && (() => {
        const r = importResult as Record<string, unknown>;
        const insertedIds = (r.insertedHotelIds || []) as unknown[];
        const skippedReasons = (r.skippedReasons || []) as string[];
        const errors = (r.errors || []) as string[];
        return (
        <div className={styles.stepContent}>
          <div className={styles.resultCard}>
            <h2>Kết quả Import</h2>

            <div className={styles.resultStats}>
              <div className={styles.resultStat}>
                <span className={styles.resultNumber}>{String(r.totalProcessed ?? 0)}</span>
                <span className={styles.resultLabel}>Tổng dòng</span>
              </div>
              <div className={`${styles.resultStat} ${styles.statSuccess}`}>
                <span className={styles.resultNumber}>{String(r.successCount ?? 0)}</span>
                <span className={styles.resultLabel}>Thành công</span>
              </div>
              <div className={`${styles.resultStat} ${styles.statSkip}`}>
                <span className={styles.resultNumber}>{String(r.skippedCount ?? 0)}</span>
                <span className={styles.resultLabel}>Bỏ qua</span>
              </div>
              <div className={`${styles.resultStat} ${styles.statError}`}>
                <span className={styles.resultNumber}>{String(r.errorCount ?? 0)}</span>
                <span className={styles.resultLabel}>Lỗi</span>
              </div>
            </div>

            {insertedIds.length > 0 && (
              <div className={styles.insertedIds}>
                <p>IDs khách sạn đã tạo (ID đầu tiên: <strong>{String(insertedIds[0])}</strong>, cuối: <strong>{String(insertedIds[insertedIds.length - 1])}</strong>)</p>
                <p>Tổng cộng: <strong>{insertedIds.length}</strong> khách sạn</p>
              </div>
            )}

            {skippedReasons.length > 0 && (
              <div className={styles.skippedBox}>
                <h4>Lý do bỏ qua ({skippedReasons.length}):</h4>
                <ul>
                  {skippedReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {errors.length > 0 && (
              <div className={styles.errorBox}>
                <h4>Lỗi khi import:</h4>
                <ul>
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            <Link href="/admin/hotels" className={styles.primaryBtn}>
              Xem danh sách khách sạn
            </Link>
            <button className={styles.secondaryBtn} onClick={handleReset}>
              Import thêm
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
