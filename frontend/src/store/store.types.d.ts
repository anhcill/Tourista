import 'next';
import { store } from './store';

declare module 'react-redux' {
    interface DefaultRootState extends ReturnType<typeof store.getState> {}
}
