import React from '@rbxts/react';
import { Pane } from 'components/ui/Pane';
import { Tooltip } from 'components/ui/Tooltip';
import { hotkeysWidget } from 'state/globals';
import { hotkeysInfo } from 'utils/hotkeyUtils';
import { Fonts, Palette } from 'utils/styling';

export function HotkeyView() {
  const tableRows: React.ReactChild[] = [];

  tableRows.push(
    <frame LayoutOrder={0} Size={new UDim2(1, 0, 0, 20)} BackgroundColor3={Palette.Background1}>
      <uicorner CornerRadius={new UDim(0, 2)} />
      <uistroke ApplyStrokeMode={Enum.ApplyStrokeMode.Border} Color={Palette.Outline} />
      <textlabel
        Size={new UDim2(0, 0, 0, 20)}
        AutomaticSize={Enum.AutomaticSize.X}
        Text={'Hotkey Label'}
        TextSize={10}
        TextColor3={Palette.DefaultText}
        FontFace={Fonts.JosefinSans.Bold}
        BackgroundTransparency={1}
        TextXAlignment={Enum.TextXAlignment.Left}
      >
        <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
      </textlabel>
      <textlabel
        Size={new UDim2(0, 0, 0, 20)}
        AutomaticSize={Enum.AutomaticSize.X}
        Text={'Hotkey'}
        TextSize={10}
        TextColor3={Palette.DefaultText}
        FontFace={Fonts.JosefinSans.Bold}
        BackgroundTransparency={1}
        TextXAlignment={Enum.TextXAlignment.Center}
      >
        <uistroke ApplyStrokeMode={Enum.ApplyStrokeMode.Border} Color={Palette.Outline} />
        <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
      </textlabel>
      <textlabel
        Size={new UDim2(0, 0, 0, 20)}
        AutomaticSize={Enum.AutomaticSize.X}
        Text={'Description'}
        TextSize={10}
        TextColor3={Palette.DefaultText}
        FontFace={Fonts.JosefinSans.Bold}
        BackgroundTransparency={1}
        TextXAlignment={Enum.TextXAlignment.Left}
      >
        <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
      </textlabel>
    </frame>
  );

  let idx = 1;
  hotkeysInfo.forEach((info, id) => {
    tableRows.push(
      <frame LayoutOrder={info.order} Size={new UDim2(1, 0, 0, 20)} BackgroundColor3={Palette.Background0}>
        <uicorner CornerRadius={new UDim(0, 2)} />
        <uistroke ApplyStrokeMode={Enum.ApplyStrokeMode.Border} Color={Palette.Outline} />
        <textlabel
          Size={new UDim2(0, 0, 0, 20)}
          AutomaticSize={Enum.AutomaticSize.X}
          Text={info.label}
          TextSize={10}
          TextColor3={Palette.DefaultText}
          FontFace={Fonts.JosefinSans.Regular}
          BackgroundTransparency={1}
          TextXAlignment={Enum.TextXAlignment.Left}
        >
          <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
        </textlabel>
        <textlabel
          Size={new UDim2(0, 0, 0, 20)}
          AutomaticSize={Enum.AutomaticSize.X}
          Text={info.keys}
          TextSize={10}
          TextColor3={Palette.DefaultText}
          FontFace={Fonts.JosefinSans.Regular}
          BackgroundTransparency={1}
          TextXAlignment={Enum.TextXAlignment.Center}
        >
          <uistroke ApplyStrokeMode={Enum.ApplyStrokeMode.Border} Color={Palette.Outline} />
          <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
        </textlabel>
        <textlabel
          Size={new UDim2(0, 0, 0, 20)}
          AutomaticSize={Enum.AutomaticSize.X}
          Text={info.description}
          TextSize={10}
          TextColor3={Palette.DefaultText}
          FontFace={Fonts.JosefinSans.Regular}
          BackgroundTransparency={1}
          TextXAlignment={Enum.TextXAlignment.Left}
        >
          <uipadding PaddingLeft={new UDim(0, 2)} PaddingRight={new UDim(0, 2)} />
        </textlabel>
      </frame>
    );

    idx += 1;
  });

  return (
    <Pane>
      <uitablelayout
        Padding={new UDim2(0, 5, 0, 0)}
        HorizontalAlignment={Enum.HorizontalAlignment.Center}
        VerticalAlignment={Enum.VerticalAlignment.Center}
        SortOrder={Enum.SortOrder.LayoutOrder}
      />

      {...tableRows}
    </Pane>
  );
}
