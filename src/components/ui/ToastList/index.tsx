import React from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { createPortal } from '@rbxts/react-roblox';
import { appWidget } from 'state/globals';
import { toastsAtom } from 'state/toasts';
import { ToastNotification } from './ToastNotification';
import { createNextOrder } from 'utils/createNextOrder';

export function ToastList() {
  const toasts = useAtom(toastsAtom);

  const nextOrder = createNextOrder();

  const toastElements: React.ReactChild[] = toasts.map((toastData) => {
    return <ToastNotification key={toastData.id} order={nextOrder()} data={toastData} duration={toastData.duration} />;
  });

  return createPortal(
    <frame key={'ToastList'} Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
      <uipadding PaddingBottom={new UDim(0, 4)} PaddingTop={new UDim(0, 4)} PaddingLeft={new UDim(0, 4)} PaddingRight={new UDim(0, 4)} />
      <uilistlayout
        FillDirection={Enum.FillDirection.Vertical}
        HorizontalAlignment={Enum.HorizontalAlignment.Right}
        VerticalAlignment={Enum.VerticalAlignment.Bottom}
        SortOrder={Enum.SortOrder.LayoutOrder}
        Padding={new UDim(0, 4)}
      />

      {...toastElements}
    </frame>,
    appWidget().unwrap()
  );
}
