interface IWidgets {
  start: DockWidgetPluginGui;
  timeline: DockWidgetPluginGui;
}

// Manages multiple plugin widgets
export class WidgetsManager {
  widgets: IWidgets;

  constructor(plugin: Plugin) {
    this.widgets = {
      // Create start widget
      start: plugin.CreateDockWidgetPluginGui(
        'roui3-start',
        new DockWidgetPluginGuiInfo(
          Enum.InitialDockState.Float,
          true,
          true,
          300,
          250,
          300,
          250
        )
      ),

      // Create timeline widget
      timeline: plugin.CreateDockWidgetPluginGui(
        'roui3-timeline',
        new DockWidgetPluginGuiInfo(
          Enum.InitialDockState.Float,
          false,
          true,
          500,
          250,
          500,
          250
        )
      ),
    };
    this.widgets.start.Title = 'Welcome to RoUI3';
    this.widgets.timeline.Title = 'RoUI3 - Timeline';
    this.widgets.timeline.Enabled = false;
  }
}

let widgetManager: WidgetsManager;

// Create the app's widget manager
export const createWidgetManager = (plugin: Plugin) => {
  widgetManager = new WidgetsManager(plugin);
  return widgetManager;
};

// Get the app's widget manager
export const getWidgetManager = () => {
  return widgetManager;
};
