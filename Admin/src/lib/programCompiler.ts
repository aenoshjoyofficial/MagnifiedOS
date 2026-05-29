import * as XLSX from 'xlsx';

export interface ProgramJSON {
  version: string;
  metadata: {
    title: string;
    description: string;
    duration_days: number;
    cover_image: string;
  };
  themes: Record<string, string>;
  modules: Array<{
    title: string;
    order_index: number;
    lessons: Array<{
      day_number: number;
      title: string;
      routine: Array<{
        window: string;
        system: string;
        anchor: string;
        instruction: string;
      }>;
      tasks: Array<{
        title: string;
        type: string;
        order_index: number;
        content: {
          routine_window: string;
          url: string;
          text: string;
          duration?: string;
        };
      }>;
      summary?: string;
    }>;
  }>;
}

// Maps task types to their standard daily routine windows
export const mapTaskTypeToWindow = (type: string): string => {
  const t = type.toLowerCase().trim();
  if (['breath', 'meditation', 'ritual', 'movement', 'somatic', 'mobility', 'checklist', 'pdf', 'video'].includes(t)) {
    return 'Morning';
  }
  if (['meal', 'nutrition'].includes(t)) {
    return 'Midday';
  }
  if (['audio'].includes(t)) {
    return 'Evening';
  }
  if (['journal', 'reflection'].includes(t)) {
    return 'Night';
  }
  return 'Morning'; // Fallback
};

// Maps Excel task types to ChamberStep types allowed in local storage
export const mapTaskTypeToStepType = (type: string): 'text' | 'pdf' | 'audio' | 'video' | 'image' => {
  const t = type.toLowerCase().trim();
  if (t === 'audio') return 'audio';
  if (t === 'video') return 'video';
  if (t === 'pdf') return 'pdf';
  if (t === 'image') return 'image';
  return 'text';
};

// Maps Excel module names (or shortcodes) to standard chamber IDs
export const getChamberIdFromModuleName = (moduleName: string): string => {
  const name = String(moduleName || '').toUpperCase().trim();
  
  if (name === 'MC' || name.includes('MENTAL CLARITY')) return 'mental-clarity';
  if (name === 'FF' || name.includes('FREQUENCY FIELD')) return 'frequency-field';
  if (name === 'FD' || name.includes('FIELD DESIGN')) return 'field-design';
  if (name === 'LF' || name.includes('LIVING FRAME')) return 'living-frame';
  if (name === 'TP' || name === 'PLATE' || name.includes('THE PLATE')) return 'the-plate';
  if (name === 'SC' || name === 'SLEEP' || name.includes('SLEEP COCOON')) return 'sleep-cocoon';
  if (name === 'BA' || name === 'BREATH' || name.includes('BREATH ATELIER')) return 'breath-atelier';
  if (name === 'SG' || name === 'SIGNATURE' || name.includes('THE SIGNATURE')) return 'the-signature';
  
  return '';
};

// Maps chamber keys to their standardized display names
export const CHAMBER_DISPLAY_NAMES: Record<string, string> = {
  'mental-clarity': 'MENTAL CLARITY',
  'frequency-field': 'THE FREQUENCY FIELD',
  'field-design': 'FIELD DESIGN',
  'living-frame': 'THE LIVING FRAME',
  'the-plate': 'THE PLATE',
  'sleep-cocoon': 'SLEEP COCOON',
  'breath-atelier': 'BREATH ATELIER',
  'the-signature': 'THE SIGNATURE',
};

// Allowed task types list for validation
export const ALLOWED_TASK_TYPES = [
  'audio', 'video', 'movement', 'breath', 'ritual', 'meal', 'journal',
  'reflection', 'meditation', 'somatic', 'mobility', 'nutrition', 'checklist', 'pdf'
];

/**
 * Validates the structure and content of the Excel workbook
 * Returns a list of error strings. If empty, the workbook is valid.
 */
export const validateWorkbook = (workbook: XLSX.WorkBook): string[] => {
  const errors: string[] = [];

  // 1. Required sheets validation
  const requiredSheets = ['PROGRAM_MASTER', 'MODULES', 'LESSONS', 'TASKS', 'MEDIA_LIBRARY'];
  const sheetNames = workbook.SheetNames;
  
  requiredSheets.forEach(sheet => {
    if (!sheetNames.includes(sheet)) {
      errors.push(`Missing Sheet: ${sheet}`);
    }
  });

  if (errors.length > 0) {
    return errors; // Return early if sheets are missing
  }

  // Helper to check columns in a sheet
  const checkColumns = (sheetName: string, requiredCols: string[]) => {
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (jsonData.length === 0) {
      errors.push(`Sheet ${sheetName} is empty.`);
      return;
    }
    const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
    requiredCols.forEach(col => {
      if (!headers.includes(col)) {
        errors.push(`Missing Column in ${sheetName}: ${col}`);
      }
    });
  };

  // 2. Validate columns
  checkColumns('PROGRAM_MASTER', [
    'program_id', 'title', 'subtitle', 'description', 'duration_days', 'level', 'category', 'status', 'practitioner', 'created_for'
  ]);
  checkColumns('MODULES', ['module_id', 'order', 'module_name', 'description']);
  checkColumns('LESSONS', ['lesson_id', 'day_number', 'week', 'title', 'theme', 'summary']);
  checkColumns('TASKS', [
    'task_id', 'lesson_id', 'module_id', 'task_order', 'task_title', 'task_type', 'duration', 'instructions', 'required', 'audio_url', 'video_url'
  ]);
  checkColumns('MEDIA_LIBRARY', ['media_id', 'type', 'title', 'url', 'module_id']);

  if (errors.length > 0) {
    return errors;
  }

  // Convert worksheets to JSON rows for content checking
  const modulesRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['MODULES']);
  const lessonsRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['LESSONS']);
  const tasksRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['TASKS']);
  const mediaRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['MEDIA_LIBRARY']);

  // 3. Allowed task types validation
  tasksRows.forEach((row, index) => {
    const rowNum = index + 2; // Row number in Excel (1-indexed header + 1-indexed content)
    const type = String(row.task_type || '').trim().toLowerCase();
    if (!type) {
      errors.push(`Row ${rowNum} in TASKS: Missing task_type`);
    } else if (!ALLOWED_TASK_TYPES.includes(type)) {
      errors.push(`Row ${rowNum} in TASKS - Invalid Task Type: "${row.task_type}". Must be one of: ${ALLOWED_TASK_TYPES.join(', ')}`);
    }
  });

  // 4. Duplicate IDs validation
  const checkDuplicateIds = (rows: any[], idKey: string, sheetName: string) => {
    const ids = new Set<string>();
    rows.forEach((row, index) => {
      const id = String(row[idKey] || '').trim();
      const rowNum = index + 2;
      if (id) {
        if (ids.has(id)) {
          errors.push(`Duplicate ID found in ${sheetName}: "${id}" at row ${rowNum}`);
        } else {
          ids.add(id);
        }
      }
    });
  };

  checkDuplicateIds(modulesRows, 'module_id', 'MODULES');
  checkDuplicateIds(lessonsRows, 'lesson_id', 'LESSONS');
  checkDuplicateIds(tasksRows, 'task_id', 'TASKS');
  checkDuplicateIds(mediaRows, 'media_id', 'MEDIA_LIBRARY');

  return errors;
};

/**
 * Compiles validated workbook data into a ProgramJSON object
 */
export const compileWorkbook = (workbook: XLSX.WorkBook): ProgramJSON => {
  const masterRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['PROGRAM_MASTER']);
  const modulesRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['MODULES']);
  const lessonsRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['LESSONS']);
  const tasksRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['TASKS']);

  const programMaster = masterRows[0] || {};

  // Build themes record: day_number -> theme text
  const themes: Record<string, string> = {};
  lessonsRows.forEach(row => {
    const day = String(row.day_number || '').trim();
    const theme = String(row.theme || '').trim();
    if (day && theme) {
      themes[day] = theme;
    }
  });

  // Sort modules by order_index
  const sortedModules = [...modulesRows].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  // Build the compiled modules list
  const compiledModules = sortedModules.map(modRow => {
    const mId = String(modRow.module_id || '').trim();
    const mName = String(modRow.module_name || '').trim();
    const chamberId = getChamberIdFromModuleName(mName);
    const standardTitle = chamberId ? CHAMBER_DISPLAY_NAMES[chamberId] : mName;

    // Filter tasks for this module
    const moduleTasks = tasksRows.filter(task => String(task.module_id || '').trim() === mId);

    // Group module tasks by lesson_id
    const tasksByLesson: Record<string, any[]> = {};
    moduleTasks.forEach(task => {
      const lId = String(task.lesson_id || '').trim();
      if (!tasksByLesson[lId]) {
        tasksByLesson[lId] = [];
      }
      tasksByLesson[lId].push(task);
    });

    // Map lessons for this module
    const lessonsList = lessonsRows.map(lessonRow => {
      const lId = String(lessonRow.lesson_id || '').trim();
      const dayNum = Number(lessonRow.day_number || 1);
      const lessonTitle = String(lessonRow.title || '').trim();

      const lessonTasks = tasksByLesson[lId] || [];
      // Sort tasks by order
      const sortedTasks = [...lessonTasks].sort((a, b) => Number(a.task_order || 0) - Number(b.task_order || 0));

      // Build routine windows
      const tasksByWindow: Record<string, any[]> = {};
      sortedTasks.forEach(task => {
        const win = mapTaskTypeToWindow(String(task.task_type || ''));
        if (!tasksByWindow[win]) {
          tasksByWindow[win] = [];
        }
        tasksByWindow[win].push(task);
      });

      const routineWindows = ['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
      const compiledRoutine = routineWindows
        .map(win => {
          const winTasks = tasksByWindow[win] || [];
          if (winTasks.length === 0) return null;

          const anchor = winTasks.map(t => String(t.task_title || '').trim()).join(' · ');
          const instruction = winTasks
            .map(t => `<p>${String(t.instructions || '').trim()}</p>`)
            .join('');

          return {
            window: win,
            system: standardTitle,
            anchor,
            instruction
          };
        })
        .filter(Boolean) as Array<{ window: string; system: string; anchor: string; instruction: string }>;

      // Build tasks array
      const mappedTasks = sortedTasks.map(task => {
        const type = String(task.task_type || '').trim().toLowerCase();
        const durationText = task.duration ? `${task.duration} min` : '5 min';
        return {
          title: String(task.task_title || '').trim(),
          type,
          order_index: Number(task.task_order || 0),
          content: {
            routine_window: mapTaskTypeToWindow(type),
            url: String(task.audio_url || task.video_url || '').trim(),
            text: String(task.instructions || '').trim(),
            duration: durationText
          }
        };
      });

      return {
        day_number: dayNum,
        title: lessonTitle,
        routine: compiledRoutine,
        tasks: mappedTasks,
        summary: String(lessonRow.summary || '').trim() // Keep temporary for directive lookup
      };
    });

    // Sort lessons by day_number
    lessonsList.sort((a, b) => a.day_number - b.day_number);

    return {
      title: standardTitle,
      order_index: Number(modRow.order || 0),
      lessons: lessonsList
    };
  });

  return {
    version: '1.0',
    metadata: {
      title: String(programMaster.title || '').trim(),
      description: String(programMaster.description || '').trim(),
      duration_days: Number(programMaster.duration_days || 30),
      cover_image: '' // Left empty as per specs
    },
    themes,
    modules: compiledModules
  };
};

/**
 * Saves compiled ProgramJSON into browser localStorage, matching the builder structure
 */
export const saveCompiledProgramToLocalStorage = (programId: string, programJson: ProgramJSON): void => {
  // 1. Write Themes
  Object.entries(programJson.themes).forEach(([dayNum, themeText]) => {
    localStorage.setItem(`program_${programId}_day_theme_${dayNum}`, themeText);
  });

  // 2. Write Chamber Scripts (ChamberScripts) for each module and day
  programJson.modules.forEach(mod => {
    const chamberId = getChamberIdFromModuleName(mod.title);
    if (!chamberId) return; // Skip if module doesn't match standard Chambers

    mod.lessons.forEach(lesson => {
      const dayNum = lesson.day_number;
      
      // Map lesson tasks to ChamberSteps
      const steps = lesson.tasks.map(task => ({
        title: task.title,
        type: mapTaskTypeToStepType(task.type),
        contentUrl: task.content.url,
        textContent: task.content.text
      }));

      // Gather active windows or default to "Upon waking" / "Varies"
      const firstRoutine = lesson.routine[0];
      const when = firstRoutine ? firstRoutine.window : 'Varies';

      // Sum task durations
      let totalDurationMinutes = 0;
      lesson.tasks.forEach(t => {
        const match = t.content.duration?.match(/(\d+)/);
        if (match) {
          totalDurationMinutes += parseInt(match[1], 10);
        }
      });
      const durationText = totalDurationMinutes > 0 ? `${totalDurationMinutes} minutes` : 'Varies';

      const scriptData = {
        title: lesson.title,
        when,
        duration: durationText,
        steps,
        directive: lesson.summary || 'Set the direction for this day.'
      };

      const storageKey = `program_${programId}_chamber_script_${chamberId}_day${dayNum}`;
      localStorage.setItem(storageKey, JSON.stringify(scriptData));
    });
  });
};
