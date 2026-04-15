import type { Request, Response } from "express";

import { getAdminDashboard } from "../services/admin-dashboard.service.js";

export async function getAdminDashboardHandler(req: Request, res: Response): Promise<void> {
  const data = await getAdminDashboard({ days: req.query.days });
  res.json(data);
}
