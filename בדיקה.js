src/services/projectService.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProjects = async (organizationId, userId, userRole, { page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc' }) => {
    const offset = (page - 1) * limit;

    let whereClause = {
        organizationId: organizationId,
    };

    if (userRole === 'EMPLOYEE') {
        whereClause.projectTeamLeads = {
            some: {
                userId: userId,
            },
        };
    }

    const projects = await prisma.project.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            // ================== התחלת התיקון ==================
            tasks: {
                // שינינו את ה-select כדי שיכלול את כל השדות הנדרשים לגאנט
                select: {
                    id: true,
                    title: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                    color: true,
                    displayOrder: true,
                    // חשוב לכלול גם את המשתמשים המשויכים כדי שנוכל לבדוק הרשאות
                    assignees: {
                        select: {
                            user: {
                                select: { id: true, fullName: true }
                            }
                        }
                    }
                },
                orderBy: {
                    displayOrder: 'asc' // מיון המשימות לפי הסדר שנקבע
                }
            },
            // =================== סוף התיקון ===================
            projectTeamLeads: {
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, profilePictureUrl: true, jobTitle: true }
                    }
                }
            },
        },
    });

    const formattedProjects = projects.map(project => {
        // המרת המבנה של assignees למבנה שטוח יותר שהלקוח מצפה לו
        const formattedTasks = project.tasks.map(task => ({
            ...task,
            assignees: task.assignees.map(a => a.user)
        }));

        return {
            ...project,
            tasks: formattedTasks, // שימוש במשימות המעובדות
            teamLeads: project.projectTeamLeads.map(ptl => ptl.user),
            projectTeamLeads: undefined,
        };
    });

    const totalProjects = await prisma.project.count({
        where: whereClause,
    });

    const totalPages = Math.ceil(totalProjects / limit);

    return {
        data: formattedProjects,
        totalItems: totalProjects,
        totalPages,
        currentPage: page,
    };
};


// --- שאר הפונקציות בקובץ נשארות ללא שינוי ---
// (הקוד המלא של שאר הפונקציות נמצא למטה)

const createProject = async (organizationId, { title, description, teamLeads: teamLeadIds, startDate, endDate, budget }) => {
    if (teamLeadIds && teamLeadIds.length > 0) {
        const existingUsers = await prisma.user.findMany({
            where: {
                id: { in: teamLeadIds },
                memberships: { some: { organizationId: organizationId } }
            },
            select: { id: true }
        });
        if (existingUsers.length !== teamLeadIds.length) {
            throw new Error('One or more specified team leads are invalid or not members of this organization.');
        }
    }

    const newProject = await prisma.project.create({
        data: {
            organizationId,
            title,
            description,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            budget,
            projectTeamLeads: {
                create: teamLeadIds.map(userId => ({ userId }))
            }
        },
        include: {
            projectTeamLeads: { include: { user: true } },
            tasks: true
        }
    });

    return {
        ...newProject,
        teamLeads: newProject.projectTeamLeads.map(ptl => ptl.user),
        projectTeamLeads: undefined,
        team: []
    };
};

const updateProject = async (projectId, organizationId, updateData) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId },
    });

    if (!project) {
        throw new Error('Project not found in this organization.');
    }

    const { teamLeads: newTeamLeadIds, ...dataToUpdate } = updateData;

    if (newTeamLeadIds !== undefined) {
        const existingUsers = await prisma.user.findMany({
            where: {
                id: { in: newTeamLeadIds },
                memberships: { some: { organizationId: organizationId } }
            },
            select: { id: true }
        });
        if (existingUsers.length !== newTeamLeadIds.length) {
            throw new Error('One or more specified new team leads are invalid or not members of this organization.');
        }
        await prisma.$transaction([
            prisma.projectTeamLead.deleteMany({ where: { projectId: projectId } }),
            prisma.projectTeamLead.createMany({ data: newTeamLeadIds.map(userId => ({ projectId, userId })) })
        ]);
    }

    const updatedProject = await prisma.project.update({
        where: { id: projectId, organizationId },
        data: {
            ...dataToUpdate,
            startDate: dataToUpdate.startDate ? new Date(dataToUpdate.startDate) : undefined,
            endDate: dataToUpdate.endDate ? new Date(dataToUpdate.endDate) : undefined,
        },
        include: {
            projectTeamLeads: { include: { user: true } },
            tasks: true
        }
    });

    return {
        ...updatedProject,
        teamLeads: updatedProject.projectTeamLeads.map(ptl => ptl.user),
        projectTeamLeads: undefined,
        team: []
    };
};

const archiveProject = async (projectId, organizationId, isArchived) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId },
    });

    if (!project) {
        throw new Error('Project not found in this organization.');
    }

    const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { isArchived },
        include: {
            projectTeamLeads: { include: { user: true } },
            tasks: true
        }
    });
    
    return {
        ...updatedProject,
        teamLeads: updatedProject.projectTeamLeads.map(ptl => ptl.user),
        projectTeamLeads: undefined,
        team: []
    };
};

const deleteProject = async (projectId, organizationId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId },
    });

    if (!project) {
        throw new Error('Project not found in this organization.');
    }
    
    await prisma.project.delete({
        where: { id: projectId },
    });
};

module.exports = {
    getAllProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
};