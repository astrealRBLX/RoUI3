import { useUpdate } from '@rbxts/pretty-react-hooks';
import React, { useBinding, useEffect } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { Option } from '@rbxts/rust-classes';
import { Selection, StudioService } from '@rbxts/services';
import { ImageButtonElement } from 'components/sections/Topbar/ImageButtonElement';
import { Pane } from 'components/ui/Pane';
import { Tooltip } from 'components/ui/Tooltip';
import { settingSyncSelections } from 'state/editor';
import { isSelectionLinked } from 'utils/selectionUtils';
import { Fonts, Palette } from 'utils/styling';

interface InstanceTreeRowProps {
  instance: Instance;
  depth: number;
  isExpandedMap: Map<Instance, boolean>;
  selectedInstance: Option<Instance>;
  classFilter: string[];
  selectFilter: (inst: Instance) => boolean;
  toggle: (inst: Instance) => void;
  nextOrder: () => number;
  onInstanceSelected: (inst: Option<Instance>) => void;
}

/*
  components/sections/InstanceTree/InstanceTreeRow

  A row that is rendered recursively as part of
  an InstanceTree.
*/
export function InstanceTreeRow({
  instance,
  depth,
  isExpandedMap,
  selectedInstance,
  classFilter,
  selectFilter,
  toggle,
  nextOrder,
  onInstanceSelected,
}: InstanceTreeRowProps) {
  const syncSelections = useAtom(settingSyncSelections);

  const update = useUpdate();

  const isExpanded = isExpandedMap.get(instance) ?? false;

  const [isHovering, setIsHovering] = useBinding(false);

  const childRows: React.ReactChild[] = isExpanded
    ? instance
        .GetChildren()
        .filter((child) => classFilter.some((cs) => child.IsA(cs as any)))
        .map((child) => {
          return (
            <InstanceTreeRow
              instance={child}
              depth={depth + 1}
              isExpandedMap={isExpandedMap}
              toggle={toggle}
              nextOrder={nextOrder}
              selectedInstance={selectedInstance}
              onInstanceSelected={onInstanceSelected}
              classFilter={classFilter}
              selectFilter={selectFilter}
            />
          );
        })
    : [];

  const iconInfo = StudioService.GetClassIcon(instance.ClassName) as {
    Image: string;
    ImageRectOffset: Vector2;
    ImageRectSize: Vector2;
  };

  const hasChildren = instance.GetChildren().size() > 0;
  const indent = depth * 10;
  const canSelect = selectFilter(instance);
  const isSelected = selectedInstance.isSome() ? selectedInstance.unwrap() === instance : false;

  useEffect(() => {
    const conn = (Selection['SelectionChanged' as never] as RBXScriptSignal).Connect(() => {
      if (syncSelections) {
        update();
      }
    });

    return () => conn.Disconnect();
  }, [syncSelections]);

  const isLinked = isSelected && syncSelections ? isSelectionLinked() : false;

  return (
    <>
      <Pane
        key={`TreeRow<${instance.GetDebugId()}>:(${instance.Name})[${depth}]`}
        size={new UDim2(1, -indent, 0, 16)}
        layoutOrder={nextOrder()}
        rounded={true}
        color={isHovering.map((hovering) => {
          if (canSelect && isSelected && hovering) {
            return syncSelections && isLinked
              ? Palette.TreeSelectionHoveringBackground
              : syncSelections && !isLinked
              ? Palette.TreeSelectionUnlinkedHoveringBackground
              : Palette.TreeSelectionHoveringBackground;
          } else if (canSelect && isSelected && !hovering) {
            return syncSelections && isLinked
              ? Palette.TreeSelectionBackground
              : syncSelections && !isLinked
              ? Palette.TreeSelectionUnlinkedBackground
              : Palette.TreeSelectionBackground;
          } else if (canSelect && !isSelected && hovering) {
            return Palette.Background4;
          } else if (canSelect && !isSelected && !hovering) {
            return Palette.Background1;
          }

          return Palette.Background1;
        })}
      >
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          HorizontalAlignment={Enum.HorizontalAlignment.Left}
          VerticalAlignment={Enum.VerticalAlignment.Center}
          SortOrder={Enum.SortOrder.LayoutOrder}
          Padding={new UDim(0, 4)}
        />

        {hasChildren ? (
          <ImageButtonElement
            layoutOrder={1}
            image='rbxasset://textures/StudioSharedUI/arrowSpritesheet.png'
            sizePx={10}
            onPressed={() => toggle(instance)}
            imageRectSize={new Vector2(12, 12)}
            imageRectOffset={isExpanded ? new Vector2(24, 0) : new Vector2(12, 0)}
          />
        ) : undefined}

        <imagelabel
          LayoutOrder={2}
          Size={new UDim2(0, 12, 0, 12)}
          BackgroundTransparency={1}
          Image={iconInfo.Image}
          ImageRectSize={iconInfo.ImageRectSize}
          ImageRectOffset={iconInfo.ImageRectOffset}
        />

        <textbutton
          LayoutOrder={3}
          Size={new UDim2(1, -32, 1, 0)}
          BackgroundTransparency={1}
          Text={instance.Name}
          FontFace={Fonts.JosefinSans.Regular}
          TextSize={12}
          TextColor3={Palette.DefaultText}
          TextXAlignment={Enum.TextXAlignment.Left}
          Event={{
            Activated: () => {
              if (canSelect) {
                if (!syncSelections) {
                  onInstanceSelected(isSelected ? Option.none() : Option.some(instance));
                } else {
                  onInstanceSelected(isSelected && isLinked ? Option.none() : Option.some(instance));
                }
              }
            },
            MouseEnter: () => {
              setIsHovering(true);
            },
            MouseLeave: () => {
              setIsHovering(false);
            },
          }}
        >
          {isSelected ? (
            <Tooltip
              title={isLinked ? `Linked` : syncSelections ? `Not Linked` : undefined}
              text={
                isLinked
                  ? `RoUI3 selection & Roblox selection are <font color="#73d99e">linked</font>.`
                  : syncSelections
                  ? `RoUI3 selection & Roblox selection are <font color="#ff4f52">not linked</font>.`
                  : `Enable <font weight="medium">Selection Syncing</font> in the topbar to sync RoUI3 and Roblox selections.`
              }
            />
          ) : undefined}
        </textbutton>
      </Pane>
      {...childRows}
    </>
  );
}
