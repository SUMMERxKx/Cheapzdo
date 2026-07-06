import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";

const App = () => (
  <Providers>
    <RouterProvider router={router} />
    <Analytics />
  </Providers>
);

export default App;
