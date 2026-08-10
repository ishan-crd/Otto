import { Tabs } from "expo-router";
import { GlassTabBar } from "../../src/components/GlassTabBar";
import { c } from "../../src/theme";

// Open on Home; other routes resolve in file order otherwise.
export const unstable_settings = { initialRouteName: "index" };

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="marketplace" />
      <Tabs.Screen name="task" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
