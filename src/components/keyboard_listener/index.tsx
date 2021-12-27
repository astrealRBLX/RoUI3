import Roact from '@rbxts/roact';
import RoactHooks from '@rbxts/roact-hooks';
import { RunService } from '@rbxts/services';
import { ShowOnTop } from 'components/show_on_top';

interface InputData {
  KeyCode: Enum.KeyCode;
}

interface IProps {
  Widget: PluginGui;
  OnKeyPressed?: (input: InputData, keysHeld: Set<Enum.KeyCode>) => void;
  OnKeyReleased?: (input: InputData) => void;
}

// KeyboardListener component that will listen for key presses on a PluginGui
// This is needed because PluginGuis are stupid and Roblox fails to provide
// an actual service or method for properly detecting input in a PluginGui
const KeyboardListenerComponent: RoactHooks.FC<IProps> = (
  { Widget, OnKeyPressed, OnKeyReleased },
  { useValue, useEffect, useCallback }
) => {
  const keysHeld = useValue<Set<Enum.KeyCode>>(new Set());
  const isFocused = useValue(false);

  const cleanupKeys = useCallback(() => {
    if (OnKeyReleased) {
      keysHeld.value.forEach((key) => {
        OnKeyReleased({
          KeyCode: key,
        });
      });
    }

    keysHeld.value.clear();
  }, [OnKeyReleased]);

  useEffect(() => {
    // Set focus value
    const focusConnection = Widget.WindowFocused.Connect(() => {
      isFocused.value = true;
    });

    // Clean up keys pressed if window focus is lost
    const focusLostConnection = Widget.WindowFocusReleased.Connect(() => {
      if (keysHeld.value.size() > 0) {
        cleanupKeys();
      }

      isFocused.value = false;
    });

    // Clean up keys pressed if mouse is outside window bounds
    const outsideWindowBoundsConnection = RunService.Heartbeat.Connect(() => {
      if (isFocused.value && keysHeld.value.size() > 0) {
        const mousePos = Widget.GetRelativeMousePosition();

        if (
          mousePos.X < 0 ||
          mousePos.Y < 0 ||
          mousePos.X > Widget.AbsoluteSize.X ||
          mousePos.Y > Widget.AbsoluteSize.Y
        ) {
          cleanupKeys();
        }
      }
    });

    return () => {
      focusConnection.Disconnect();
      focusLostConnection.Disconnect();
      outsideWindowBoundsConnection.Disconnect();
    };
  }, []);

  return (
    <ShowOnTop Widget={Widget}>
      <frame
        Size={new UDim2(1, 0, 1, 0)}
        BackgroundTransparency={1}
        Event={{
          InputBegan: (_, input) => {
            if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

            keysHeld.value.add(input.KeyCode);

            if (OnKeyPressed)
              OnKeyPressed(
                {
                  KeyCode: input.KeyCode,
                },
                keysHeld.value
              );
          },
          InputEnded: (_, input) => {
            if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

            keysHeld.value.delete(input.KeyCode);

            if (OnKeyReleased)
              OnKeyReleased({
                KeyCode: input.KeyCode,
              });
          },
        }}
      />
    </ShowOnTop>
  );
};

export const KeyboardListener = new RoactHooks(Roact)(
  KeyboardListenerComponent
);
