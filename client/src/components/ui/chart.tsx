
import { TrendingUp } from "lucide-react"
import {
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  LabelList, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  RadialBar, 
  RadialBarChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis
} from "recharts"

import {
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card"

export const Chart = ({type, data}) => {
  const chartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
  ]

  switch (type) {
    case "area-chart-stacked":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Area Chart - Stacked</CardTitle>
            <CardDescription>
              Showing total visitors for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <Tooltip cursor={false} />
                <Area
                  dataKey="desktop"
                  type="natural"
                  fill="var(--color-desktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                  stackId="a"
                />
                <Area
                  dataKey="mobile"
                  type="natural"
                  fill="var(--color-mobile)"
                  fillOpacity={0.4}
                  stroke="var(--color-mobile)"
                  stackId="a"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  January - June 2024
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      )
    case "bar-chart":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <Tooltip
                  cursor={false}
                />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total visitors for the last 6 months
            </div>
          </CardFooter>
        </Card>
      )
    case "line-chart":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Line Chart</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 24,
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <Tooltip
                  wrapperStyle={{
                    outline: "none",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  dataKey="desktop"
                  type="monotone"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                  dot={{_jsxDEV: true,}}
                />
                <Line
                  dataKey="mobile"
                  type="monotone"
                  stroke="var(--color-mobile)"
                  strokeWidth={2}
                  dot={{ _jsxDEV: true,}}
                />
                <LabelList
                  dataKey="desktop"
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
                 <LabelList
                  dataKey="mobile"
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )
    case "pie-chart":
      return (
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Pie Chart</CardTitle>
            <CardDescription>Daily Budget Usage</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip
                  cursor={false}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )
    case "radial-chart":
      return (
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Radial Chart</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                data={chartData}
                innerRadius="30%"
                outerRadius="80%"
              >
                <Tooltip
                  cursor={false}
                />
                <RadialBar
                  dataKey="visitors"
                  background
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total visitors for the last 6 months
            </div>
          </CardFooter>
        </Card>
      )
    case "histogram":
        return (
            <Card>
            <CardHeader>
                <CardTitle>Histogram</CardTitle>
                <CardDescription>Weekly Distance Traveled</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="distance" fill="var(--color-chart-1)" />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        )
    default:
      return <div>Invalid chart type</div>;
  }
}
