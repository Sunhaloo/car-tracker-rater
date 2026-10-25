import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// colour per rating ==> the text is always shown too, so colour is never the only signal
const COLOURS = {
  Good: "bg-green-600/15 text-green-700 dark:text-green-400",
  Normal: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Bad: "bg-red-600/15 text-red-700 dark:text-red-400",
}

// `rating` comes straight from the API ( "Good" / "Normal" / "Bad" / "Not enough data" ) ==> never computed here
export function RatingBadge({ rating }) {
  if (!rating) return null
  const colour = COLOURS[rating]
  return (
    <Badge variant={colour ? "default" : "outline"} className={cn(colour)}>
      {rating}
    </Badge>
  )
}
