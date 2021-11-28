let plugin: Plugin;

export function setPlugin(plug: Plugin) {
  print('setting plugin to', plug);
  plugin = plug;
}

export function getPlugin() {
  print('current plugin: ', plugin);
  return plugin;
}
