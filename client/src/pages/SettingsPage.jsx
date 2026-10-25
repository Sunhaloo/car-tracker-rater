import { DevicesSection } from "@/components/settings/DevicesSection"
import { PlacesSection } from "@/components/settings/PlacesSection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// the user's ThingSpeak devices and personal places
export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="places">Places</TabsTrigger>
        </TabsList>
        <TabsContent value="devices">
          <DevicesSection />
        </TabsContent>
        <TabsContent value="places">
          <PlacesSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
