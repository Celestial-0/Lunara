import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Settings } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Settings className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Under Maintenance
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              We&apos;re working hard to improve your experience
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Scheduled Maintenance
            </CardTitle>
            <CardDescription>
              Lunara is temporarily unavailable while we perform important updates
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                In Progress
              </Badge>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm">What we&apos;re working on:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• System performance improvements</li>
                <li>• Security updates</li>
                <li>• New feature deployments</li>
                <li>• Database optimizations</li>
              </ul>
            </div>
            
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We&apos;ll be back online shortly. Thank you for your patience!
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Need urgent support? Contact us at{" "}
            <a href="mailto:yashkumarsingh@ieee.org" className="text-blue-600 hover:underline">
              yashkumarsingh@ieee.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
