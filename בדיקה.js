// פונקציה להמרת הנתונים לפורמט של הספרייה
const mapProjectsToGanttTasks = (projects) => {
  const ganttTasks = [];

  projects.forEach(project => {
    // הוספת הפרויקט עצמו כפריט מסוג 'project'
    ganttTasks.push({
      id: project.id,
      name: project.title,
      type: 'project',
      start: new Date(project.startDate),
      end: new Date(project.endDate),
      progress: project.completionPercentage || 0,
      // הסתרת החצים לגרירת תלות
      hideChildren: false, 
    });

    // הוספת המשימות של הפרויקט
    if (project.tasks) {
      project.tasks.forEach(task => {
        ganttTasks.push({
          id: task.id,
          name: task.title,
          type: 'task',
          start: new Date(task.startDate),
          end: new Date(task.endDate),
          progress: task.status === 'הושלם' ? 100 : 0, // ניתן לחשב התקדמות מורכבת יותר
          project: project.id, // קישור המשימה לפרויקט האב
          dependencies: task.dependencies || [], // תמיכה בתלויות (אופציונלי)
        });
      });
    }
  });

  return ganttTasks;
};
