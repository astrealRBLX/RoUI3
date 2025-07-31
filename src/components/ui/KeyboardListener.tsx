import { Atom } from '@rbxts/charm';
import React, { useEffect, useRef } from '@rbxts/react';
import { useAtom } from '@rbxts/react-charm';
import { createPortal } from '@rbxts/react-roblox';
import { RunService } from '@rbxts/services';
import { appWidget } from 'state/globals';
import { getRelativeMouse } from 'utils/getRelativeMouse';

interface KeyboardListenerProps {
  activeKeysAtom: Atom<Set<Enum.KeyCode>>;
}

/*
  components/ui/KeyboardListener

  Listens for keyboard input from a DockWidgetPluginGui
  and updates a passed Atom as keyboard input changes
*/
export function KeyboardListener({ activeKeysAtom }: KeyboardListenerProps) {
  const widget = useAtom(appWidget).unwrap();

  const focused = useRef(false);
  const activeInput = useRef<Set<Enum.KeyCode>>(new Set());

  useEffect(() => {
    const connections: Array<RBXScriptConnection> = [];

    connections.push(
      widget.WindowFocused.Connect(() => {
        focused.current = true;
      })
    );

    connections.push(
      widget.WindowFocusReleased.Connect(() => {
        if (activeInput.current.size() > 0) {
          activeInput.current.clear();
          activeKeysAtom(activeInput.current);
        }

        focused.current = false;
      })
    );

    connections.push(
      RunService.Heartbeat.Connect(() => {
        if (focused.current && activeInput.current.size() > 0) {
          const mousePos = getRelativeMouse();

          if (mousePos.X < 0 || mousePos.Y < 0 || mousePos.X > widget.AbsoluteSize.X || mousePos.Y > widget.AbsoluteSize.Y) {
            activeInput.current.clear();
            activeKeysAtom(activeInput.current);
          }
        }
      })
    );

    return () => {
      connections.forEach((conn) => conn.Disconnect());
    };
  }, []);

  return createPortal(
    <frame
      Size={new UDim2(1, 0, 1, 0)}
      BackgroundTransparency={1}
      Event={{
        InputBegan: (_, input) => {
          if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

          activeInput.current.add(input.KeyCode);

          const updated = new Set([...activeInput.current]);

          activeKeysAtom(updated);
        },
        InputEnded: (_, input) => {
          if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

          const removed = activeInput.current.delete(input.KeyCode);

          if (removed) {
            const updated = new Set([...activeInput.current]);

            activeKeysAtom(updated);
          }
        },
      }}
    />,
    widget
  );
}
