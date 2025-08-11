import { tabRoutes } from "../../utils/tabs";
import { Tabs } from "expo-router/tabs";
import { Home, Layers, Mail, Plus, Users } from "lucide-react-native";

const TabRouter = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "green",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: {
          textTransform: "capitalize",
          fontSize: 12,
          width: "auto",
        },
      }}
    >
      {tabRoutes.map((tab, index) => {
        const IconComponent = tab.icon;
        return (
          <Tabs.Screen
            key={index}
            name={tab.url.replace("/", "")}
            options={{
              title: tab.name,
              tabBarIcon: ({ color, size }) => (
                <IconComponent color={color} size={size} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
};

export default TabRouter;
