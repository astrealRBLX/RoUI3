import { atom } from '@rbxts/charm';
import { HttpService } from '@rbxts/services';
import { Palette } from 'utils/styling';

export enum ToastType {
  Info,
  Success,
  Warning,
  Error,
}

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

export const ToastPalette = new Map([
  [ToastType.Info, Palette.Info],
  [ToastType.Success, Palette.Success],
  [ToastType.Warning, Palette.Warning],
  [ToastType.Error, Palette.Error],
]);

export const ToastImages = new Map([
  [ToastType.Info, 'rbxassetid://71303307081813'],
  [ToastType.Success, 'rbxassetid://122868858463765'],
  [ToastType.Warning, 'rbxassetid://92734400601854'],
  [ToastType.Error, 'rbxassetid://73265274908952'],
]);

export const toastsAtom = atom<ToastData[]>([]);

export namespace ToastManager {
  export function addToast(data: Omit<ToastData, 'id' | 'duration'> & Partial<Pick<ToastData, 'duration'>>) {
    const id = HttpService.GenerateGUID(false);
    const toastData = {
      ...data,
      id: id,
      duration: data.duration ?? 3,
    };

    toastsAtom((toasts) => [...toasts, toastData]);

    return id;
  }

  export function removeToast(id: string) {
    toastsAtom((toasts) => toasts.filter((toastData) => toastData.id !== id));
  }

  export function clearToasts() {
    toastsAtom([]);
  }
}
