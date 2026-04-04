'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { hideToast } from '../../../store/slices/uiSlice';
import 'react-toastify/dist/ReactToastify.css';

const Toast = () => {
    const dispatch = useDispatch();
    const { toast: toastState } = useSelector((state) => state.ui);

    useEffect(() => {
        if (toastState.show) {
            const toastOptions = {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                onClose: () => dispatch(hideToast()),
            };

            switch (toastState.type) {
                case 'success':
                    toast.success(toastState.message, toastOptions);
                    break;
                case 'error':
                    toast.error(toastState.message, toastOptions);
                    break;
                case 'warning':
                    toast.warning(toastState.message, toastOptions);
                    break;
                case 'info':
                default:
                    toast.info(toastState.message, toastOptions);
                    break;
            }
        }
    }, [toastState, dispatch]);

    return <ToastContainer />;
};

export default Toast;
