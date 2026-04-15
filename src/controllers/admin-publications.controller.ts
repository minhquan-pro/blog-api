import type { Request, Response } from "express";

import {
  addAdminPublicationMember,
  createAdminPublication,
  deleteAdminPublication,
  getAdminPublication,
  listAdminPublicationMembers,
  listAdminPublications,
  patchAdminPublicationMember,
  removeAdminPublicationMember,
  updateAdminPublication,
} from "../services/admin-publications.service.js";

export async function getAdminPublicationsList(_req: Request, res: Response): Promise<void> {
  const data = await listAdminPublications();
  res.json(data);
}

export async function postAdminPublication(req: Request, res: Response): Promise<void> {
  const data = await createAdminPublication(req.body);
  res.status(201).json(data);
}

export async function getAdminPublicationById(req: Request, res: Response): Promise<void> {
  const data = await getAdminPublication(req.params.id);
  res.json(data);
}

export async function patchAdminPublicationHandler(req: Request, res: Response): Promise<void> {
  const data = await updateAdminPublication(req.params.id, req.body);
  res.json(data);
}

export async function deleteAdminPublicationHandler(req: Request, res: Response): Promise<void> {
  await deleteAdminPublication(req.params.id);
  res.status(204).send();
}

export async function getAdminPublicationMembersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await listAdminPublicationMembers(req.params.id);
  res.json(data);
}

export async function postAdminPublicationMemberHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await addAdminPublicationMember(req.params.id, req.body);
  res.status(201).json(data);
}

export async function patchAdminPublicationMemberHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await patchAdminPublicationMember(req.params.id, req.params.userId, req.body);
  res.json(data);
}

export async function deleteAdminPublicationMemberHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await removeAdminPublicationMember(req.params.id, req.params.userId);
  res.status(204).send();
}
