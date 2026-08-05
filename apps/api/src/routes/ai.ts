import { Router, Request, Response } from "express";
import { z } from "zod";
import { analyzeNotes, getStructuringOptions, getSuggestions } from "@lib/gemini";
import { requireAuth } from "@middleware/auth";

const router = Router();

router.use(requireAuth);

const analyzeNotesSchema = z.object({
  notes: z.string().min(10, "Notes must be at least 10 characters"),
});

const structureSchema = z.object({
  analysis: z.object({
    categories: z.object({
      gastos: z.array(z.any()).optional(),
      tareas: z.array(z.any()).optional(),
      recordatorios: z.array(z.any()).optional(),
      deseos: z.array(z.any()).optional(),
    }).optional(),
    summary: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
  }),
});

router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { notes } = analyzeNotesSchema.parse(req.body);

    const analysis = await analyzeNotes(notes);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error analyzing notes:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze notes",
    });
  }
});

router.post("/structure", async (req: Request, res: Response) => {
  try {
    const { analysis } = structureSchema.parse(req.body);

    if (!analysis || !analysis.categories) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis data provided",
      });
    }

    const options = await getStructuringOptions(analysis as any);

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error getting structure options:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get structure options",
    });
  }
});

router.post("/suggestions", async (req: Request, res: Response) => {
  try {
    const { analysis } = structureSchema.parse(req.body);

    if (!analysis || !analysis.categories) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis data provided",
      });
    }

    const suggestions = await getSuggestions(analysis as any);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error getting suggestions:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get suggestions",
    });
  }
});

export default router;
