import React, { useCallback, useEffect, useState } from '@rbxts/react';
import { Pane } from 'components/ui/Pane';
import { Palette } from 'utils/styling';
import { InstanceTreeRow } from './InstanceTreeRow';
import { useMountEffect, useUpdateEffect } from '@rbxts/pretty-react-hooks';
import { createNextOrder } from 'utils/createNextOrder';
import { Option } from '@rbxts/rust-classes';
import { instanceTreeSelection } from 'state/timeline';
import { useAtom } from '@rbxts/react-charm';
import { Selection } from '@rbxts/services';

interface InstanceTreeProps {
  children?: React.ReactNode;
  root: Instance;
  baseClassFilter?: any;
  selectFilter?: (inst: Instance) => boolean;
}

/*
  components/sections/InstanceTree

  A section used in the `EditorView` to provide
  functionality to the `Timeline`. Displays a copy
  of an instance's hierarchy using a tree view.
*/
export function InstanceTree({
  root,
  baseClassFilter = 'Instance',
  selectFilter = () => true,
}: InstanceTreeProps) {
  const nextOrder = createNextOrder();

  const treeSelection = useAtom(instanceTreeSelection);
  const [isExpandedMap, setIsExpandedMap] = useState<Map<Instance, boolean>>(
    new Map([[root, true]])
  );

  const toggle = useCallback(
    (inst: Instance) => {
      const newMap = new Map([...isExpandedMap]);
      const current = newMap.get(inst) ?? false;

      newMap.set(inst, !current);
      setIsExpandedMap(newMap);
    },
    [isExpandedMap]
  );

  return (
    <Pane transparency={1} key={'InstanceTree'}>
      <scrollingframe
        Size={new UDim2(1, 0, 1, 0)}
        CanvasSize={new UDim2(0, 0, 0, 0)}
        ScrollingDirection={Enum.ScrollingDirection.Y}
        AutomaticCanvasSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        ScrollBarThickness={3}
        ScrollBarImageColor3={Palette.White}
      >
        <uilistlayout
          HorizontalAlignment={Enum.HorizontalAlignment.Right}
          VerticalAlignment={Enum.VerticalAlignment.Top}
          FillDirection={Enum.FillDirection.Vertical}
          SortOrder={Enum.SortOrder.LayoutOrder}
          Padding={new UDim(0, 2)}
        />

        <InstanceTreeRow
          instance={root}
          depth={0}
          isExpandedMap={isExpandedMap}
          toggle={toggle}
          nextOrder={nextOrder}
          selectedInstance={treeSelection}
          onInstanceSelected={(inst) => {
            Selection.Set(inst.isSome() ? [inst.unwrap()] : []);

            instanceTreeSelection(inst);
          }}
          classFilter={baseClassFilter}
          selectFilter={selectFilter}
        />
      </scrollingframe>
    </Pane>
  );
}
