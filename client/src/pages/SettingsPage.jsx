import { DevicesSection } from "@/components/settings/DevicesSection"
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
          <p className="text-muted-foreground">Places are added in the next step.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
