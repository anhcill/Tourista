import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loading: false,
    toast: {
        show: false,
        message: '',
        type: 'info', // 'success', 'error', 'warning', 'info'
    },
    modal: {
        show: false,
        type: null,
        data: null,
    },
    sidebar: {
        isOpen: false,
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Loading
        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        // Toast
        showToast: (state, action) => {
            state.toast = {
                show: true,
                message: action.payload.message,
                type: action.payload.type || 'info',
            };
        },

        hideToast: (state) => {
            state.toast = {
                show: false,
                message: '',
                type: 'info',
            };
        },

        // Modal
        showModal: (state, action) => {
            state.modal = {
                show: true,
                type: action.payload.type,
                data: action.payload.data || null,
            };
        },

        hideModal: (state) => {
            state.modal = {
                show: false,
                type: null,
                data: null,
            };
        },

        // Sidebar
        toggleSidebar: (state) => {
            state.sidebar.isOpen = !state.sidebar.isOpen;
        },

        openSidebar: (state) => {
            state.sidebar.isOpen = true;
        },

        closeSidebar: (state) => {
            state.sidebar.isOpen = false;
        },
    },
});

export const {
    setLoading,
    showToast,
    hideToast,
    showModal,
    hideModal,
    toggleSidebar,
    openSidebar,
    closeSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
