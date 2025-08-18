import React, { useBinding, useEffect, useState } from '@rbxts/react';
import { ToastData, ToastImages, ToastManager, ToastPalette } from 'state/toasts';
import { Pane } from '../Pane';
import { Fonts, Palette } from 'utils/styling';
import { RunService, TextService } from '@rbxts/services';

interface ToastNotificationProps {
  order: number;
  data: ToastData;
  duration?: number;
}

export function ToastNotification({ order, data, duration = 3 }: ToastNotificationProps) {
  const [toastSize, setToastSize] = useState(new Vector2(0, 0));

  const [timeElapsed, setTimeElapsed] = useBinding(0);

  useEffect(() => {
    const t = task.spawn(() => {
      const tParams = new Instance('GetTextBoundsParams');
      tParams.Font = Fonts.JosefinSans.Regular;
      tParams.Size = 10;
      tParams.Width = 200;
      tParams.Text = data.message;
      tParams.RichText = true;

      const textSize = TextService.GetTextBoundsAsync(tParams);
      const targetWidth = textSize.X + 16;
      const targetHeight = textSize.Y + 16;

      setToastSize(new Vector2(targetWidth, targetHeight));
    });

    const conn = RunService.RenderStepped.Connect((dt) => {
      setTimeElapsed(timeElapsed.getValue() + dt);

      if (timeElapsed.getValue() >= duration) {
        ToastManager.removeToast(data.id);
      }
    });

    return () => {
      task.cancel(t);
      conn.Disconnect();
    };
  }, []);

  const color = ToastPalette.get(data.type);
  const image = ToastImages.get(data.type);

  return (
    <Pane
      layoutOrder={order}
      zIndex={100}
      rounded={true}
      size={new UDim2(0, toastSize.X + 18, 0, toastSize.Y)}
      color={Palette.Background1}
      outlined={true}
      outlineColor={color}
    >
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        HorizontalAlignment={Enum.HorizontalAlignment.Left}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        SortOrder={Enum.SortOrder.LayoutOrder}
        Padding={new UDim(0, 4)}
      />
      <imagelabel
        ZIndex={101}
        Image={image}
        Size={new UDim2(0, 18, 0, 18)}
        ImageColor3={color}
        BackgroundTransparency={1}
        ScaleType={Enum.ScaleType.Fit}
      />
      <textlabel
        LayoutOrder={1}
        ZIndex={101}
        Text={data.message}
        TextColor3={Palette.White}
        TextSize={10}
        Size={new UDim2(1, -20, 1, -4)}
        TextXAlignment={Enum.TextXAlignment.Left}
        BackgroundTransparency={1}
        TextWrapped={true}
        FontFace={Fonts.JosefinSans.Regular}
        RichText={true}
      >
        <frame
          ZIndex={101}
          AnchorPoint={new Vector2(0.5, 0)}
          Size={new UDim2(1, -4, 0, 1)}
          Position={new UDim2(0.5, 0, 1, 2)}
          BackgroundColor3={Palette.Background0}
        >
          <uistroke ApplyStrokeMode={Enum.ApplyStrokeMode.Border} Color={color} Transparency={0.5} />
          <uicorner CornerRadius={new UDim(0, 2)} />
          <frame
            ZIndex={102}
            Size={timeElapsed.map((progress) => new UDim2(1 - progress / duration, 0, 1, 0))}
            BackgroundColor3={color}
            BorderSizePixel={0}
          >
            <uicorner CornerRadius={new UDim(0, 2)} />
          </frame>
        </frame>
      </textlabel>
    </Pane>
  );
}
