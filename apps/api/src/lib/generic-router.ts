import { Router, RequestHandler, Response } from "express";
import { ZodSchema } from "zod";
import { AuthRequest, HttpError } from "@/types";

/**
 * Service contract for a generic resource.
 * Implement only the methods you need — the router will only mount
 * the corresponding HTTP verbs.
 */
export interface GenericService<T, CreateInput = unknown, UpdateInput = unknown> {
  findAll?: (params: Record<string, string>, user: AuthRequest["user"]) => Promise<T[]>;
  findById?: (id: string, user: AuthRequest["user"]) => Promise<T | null>;
  create?: (data: CreateInput, user: AuthRequest["user"]) => Promise<T>;
  update?: (id: string, data: UpdateInput, user: AuthRequest["user"]) => Promise<T>;
  remove?: (id: string, user: AuthRequest["user"]) => Promise<void>;
}

export interface GenericRouterOptions<T, C, U> {
  service: GenericService<T, C, U>;
  /** Zod schema to validate POST body */
  createSchema?: ZodSchema<C>;
  /** Zod schema to validate PATCH body */
  updateSchema?: ZodSchema<U>;
  /** Extra middleware to run before every handler on this router */
  before?: RequestHandler[];
}

/**
 * Creates an Express Router with standard CRUD endpoints from a service.
 *
 * Mounted endpoints (only if service method exists):
 *   GET    /          → service.findAll(query, user)
 *   GET    /:id       → service.findById(id, user)
 *   POST   /          → service.create(body, user)
 *   PATCH  /:id       → service.update(id, body, user)
 *   DELETE /:id       → service.remove(id, user)
 */
export function createRouter<T, C = unknown, U = unknown>(
  opts: GenericRouterOptions<T, C, U>
): Router {
  const { service, createSchema, updateSchema, before = [] } = opts;
  const router = Router();

  if (before.length) router.use(...(before as [RequestHandler]));

  if (service.findAll) {
    router.get("/", async (req, res: Response, next) => {
      try {
        const user = (req as AuthRequest).user;
        const data = await service.findAll!(
          req.query as Record<string, string>,
          user
        );
        res.json(data);
      } catch (e) {
        next(e);
      }
    });
  }

  if (service.findById) {
    router.get("/:id", async (req, res: Response, next) => {
      try {
        const user = (req as unknown as AuthRequest).user;
        const data = await service.findById!(req.params.id, user);
        if (!data) throw new HttpError(404, "Resource not found");
        res.json(data);
      } catch (e) {
        next(e);
      }
    });
  }

  if (service.create) {
    router.post("/", async (req, res: Response, next) => {
      try {
        const user = (req as AuthRequest).user;
        const body = createSchema ? createSchema.parse(req.body) : (req.body as C);
        const data = await service.create!(body, user);
        res.status(201).json(data);
      } catch (e) {
        next(e);
      }
    });
  }

  if (service.update) {
    router.patch("/:id", async (req, res: Response, next) => {
      try {
        const user = (req as unknown as AuthRequest).user;
        const body = updateSchema ? updateSchema.parse(req.body) : (req.body as U);
        const data = await service.update!(req.params.id, body, user);
        res.json(data);
      } catch (e) {
        next(e);
      }
    });
  }

  if (service.remove) {
    router.delete("/:id", async (req, res: Response, next) => {
      try {
        const user = (req as unknown as AuthRequest).user;
        await service.remove!(req.params.id, user);
        res.status(204).send();
      } catch (e) {
        next(e);
      }
    });
  }

  return router;
}
