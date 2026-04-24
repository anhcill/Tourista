'use client';

import { useCallback, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTrashAlt, FaSpinner, FaCheck, FaTimes, FaImage } from 'react-icons/fa';
import imageApi from '@/api/imageApi';
import styles from './ImageUpload.module.css';

/**
 * Reusable image upload component.
 *
 * Props:
 *   value: string[]          - Array of image URLs currently stored
 *   onChange: (urls: string[]) => void  - Called when URLs change (add/remove)
 *   maxImages?: number        - Max images allowed (default: 20)
 *   disabled?: boolean        - Disable interactions
 */
export default function ImageUpload({
    value = [] as string[],
    onChange,
    maxImages = 20,
    disabled = false,
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setError('');

        const currentUrls = value || [];
        const remaining = maxImages - currentUrls.length;
        if (remaining <= 0) {
            setError(`Đã đạt giới hạn ${maxImages} ảnh.`);
            return;
        }

        const toUpload = files.slice(0, remaining);

        setUploading(true);

        try {
            const newUrls: string[] = [];

            for (const file of toUpload) {
                setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));

                try {
                    const result = await imageApi.uploadImage(file);
                    newUrls.push(result.url);
                    setUploadProgress(prev => ({ ...prev, [file.name]: 'done' }));
                } catch (err) {
                    console.error(`Upload failed for ${file.name}:`, err);
                    setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }));
                }
            }

            if (newUrls.length > 0) {
                onChange([...currentUrls, ...newUrls]);
            }

            const failed = toUpload.length - newUrls.length;
            if (failed > 0) {
                setError(`${failed} ảnh tải lên thất bại. Vui lòng thử lại.`);
            }
        } finally {
            setUploading(false);
            setUploadProgress({});
            if (inputRef.current) inputRef.current.value = '';
        }
    }, [value, maxImages, onChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled || uploading) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length && inputRef.current) {
            const dt = new DataTransfer();
            files.forEach(f => dt.items.add(f));
            inputRef.current.files = dt.files;
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.FileList.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(inputRef.current, '');
            }
            const event = new Event('change', { bubbles: true });
            inputRef.current.dispatchEvent(event);
        }
    }, [disabled, uploading]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const removeImage = useCallback((url: string) => {
        const currentUrls = value || [];
        onChange(currentUrls.filter(u => u !== url));
    }, [value, onChange]);

    const moveImage = useCallback((fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= value.length) return;
        const urls = [...value];
        const [moved] = urls.splice(fromIndex, 1);
        urls.splice(toIndex, 0, moved);
        onChange(urls);
    }, [value, onChange]);

    const currentUrls = value || [];
    const canAddMore = currentUrls.length < maxImages && !disabled;

    return (
        <div className={styles.container}>
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={disabled || uploading}
                className={styles.hiddenInput}
            />

            {/* Upload zone */}
            {canAddMore && (
                <div
                    className={`${styles.dropzone} ${uploading ? styles.dropzoneUploading : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                    aria-label="Tải ảnh lên"
                >
                    {uploading ? (
                        <div className={styles.uploadingState}>
                            <FaSpinner className={styles.spinner} />
                            <span>Đang tải ảnh lên...</span>
                        </div>
                    ) : (
                        <>
                            <FaCloudUploadAlt className={styles.uploadIcon} />
                            <div className={styles.dropzoneText}>
                                <strong>Kéo thả ảnh hoặc nhấn để chọn file</strong>
                                <span>JPEG, PNG, WebP, GIF — tối đa 10MB/ảnh · còn {maxImages - currentUrls.length} slot</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className={styles.errorBar}>
                    <FaTimes className={styles.errorIcon} />
                    <span>{error}</span>
                    <button type="button" onClick={() => setError('')} className={styles.errorDismiss}>
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Image grid */}
            {currentUrls.length > 0 && (
                <div className={styles.imageGrid}>
                    {currentUrls.map((url, index) => (
                        <div key={url} className={styles.imageCard}>
                            <img
                                src={url}
                                alt={`Ảnh ${index + 1}`}
                                className={styles.imageThumb}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23f0f0f0" width="200" height="120"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="12">Ảnh lỗi</text></svg>';
                                }}
                            />
                            {/* Cover badge for first image */}
                            {index === 0 && (
                                <div className={styles.coverBadge}>Cover</div>
                            )}
                            {/* Index badge */}
                            <div className={styles.indexBadge}>{index + 1}</div>

                            {/* Controls overlay */}
                            {!disabled && (
                                <div className={styles.imageControls}>
                                    {/* Move left */}
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            className={styles.controlBtn}
                                            onClick={() => moveImage(index, index - 1)}
                                            title="Chuyển trái"
                                        >
                                            ‹
                                        </button>
                                    )}
                                    {/* Move right */}
                                    {index < currentUrls.length - 1 && (
                                        <button
                                            type="button"
                                            className={styles.controlBtn}
                                            onClick={() => moveImage(index, index + 1)}
                                            title="Chuyển phải"
                                        >
                                            ›
                                        </button>
                                    )}
                                    {/* Remove */}
                                    <button
                                        type="button"
                                        className={`${styles.controlBtn} ${styles.removeBtn}`}
                                        onClick={() => removeImage(url)}
                                        title="Xóa ảnh"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Help text */}
            {currentUrls.length === 0 && !canAddMore && (
                <div className={styles.emptyHint}>
                    <FaImage />
                    <span>Chưa có ảnh nào. Nhấn nút trên để tải ảnh lên.</span>
                </div>
            )}

            <p className={styles.hint}>
                Ảnh đầu tiên sẽ là <strong>ảnh cover</strong> (hiển thị chính).
                Kéo thả hoặc dùng nút ‹ › để sắp xếp thứ tự ảnh.
                {currentUrls.length > 0 && ` (${currentUrls.length}/${maxImages} ảnh)`}
            </p>
        </div>
    );
}
