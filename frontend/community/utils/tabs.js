import { Home, Layers, Mail, Plus, Users } from 'lucide-react-native'

export const tabRoutes = [
    { name: "Feed", url: "/home", icon: Home },
    { name: "Stack", url: "/stack", icon: Layers },
    { name: "Add", url: "/add", icon: Plus },
    { name: "Space", url: "/space", icon: Users },
    { name: "Message", url: "/message", icon: Mail }
];
