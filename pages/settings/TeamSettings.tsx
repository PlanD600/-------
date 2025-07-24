

import React, { useState, useMemo, useId } from 'react';
import { User, Team } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, EditIcon, TrashIcon } from '../../components/icons';
import TeamForm from '../../components/TeamForm';

interface TeamSettingsProps {
    teams: Team[];
    users: User[];
    refreshData: () => Promise<void>;
}

const TeamSettings = ({ teams, users, refreshData }: TeamSettingsProps) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [teamToView, setTeamToView] = useState<Team | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formModalTitleId = useId();
    const viewModalTitleId = useId();
    
    const usersMap = useMemo(() => {
        return new Map(users.map(u => [u.id, u]));
    }, [users]);
    
    const handleOpenCreateModal = () => {
        setTeamToEdit(null);
        setError('');
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (team: Team) => {
        setTeamToEdit(team);
        setError('');
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setTeamToEdit(null);
    }
    
    const handleFormSubmit = async (data: Pick<Team, 'name' | 'leadIds' | 'memberIds'>) => {
        setLoading(true);
        setError('');
        try {
            if (teamToEdit) {
                await api.updateTeam(teamToEdit.id, data);
            } else {
                await api.createTeam(data);
            }
            await refreshData();
            handleCloseFormModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteTeam = async () => {
        if (!teamToDelete) return;
        setLoading(true);
        try {
            await api.deleteTeam(teamToDelete.id);
            await refreshData();
            setTeamToDelete(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete team');
        } finally {
            setLoading(false);
        }
    };
    
    const renderTeamList = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => {
                const leads = team.leadIds.map(id => usersMap.get(id)?.fullName).filter(Boolean).join(', ');
                return (
                    <div 
                        key={team.id} 
                        onClick={() => setTeamToView(team)} 
                        className="bg-gray-50 rounded-lg border p-4 flex flex-col justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <div>
                            <h4 className="font-bold text-lg text-gray-800">{team.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold">ראשי צוות:</span> {leads || 'לא שויך'}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold">חברים:</span> {team.memberIds.length}
                            </p>
                        </div>
                        <div className="flex items-center justify-end space-x-2 space-x-reverse mt-4">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(team); }} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200" aria-label={`ערוך צוות ${team.name}`}>
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setTeamToDelete(team); }} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200" aria-label={`מחק צוות ${team.name}`}>
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">ניהול צוותים</h3>
                <button onClick={handleOpenCreateModal} className="flex items-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-4 py-2 rounded-lg shadow hover:bg-opacity-90 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>צור צוות חדש</span>
                </button>
            </div>
            
            {teams.length > 0 ? renderTeamList() : <p className="text-gray-500 text-center py-8">עדיין לא נוצרו צוותים בארגון.</p>}

            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} titleId={formModalTitleId}>
                <TeamForm
                    titleId={formModalTitleId}
                    team={teamToEdit}
                    users={users}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseFormModal}
                    apiError={error}
                    isLoading={loading}
                />
            </Modal>
            
            <Modal isOpen={!!teamToView} onClose={() => setTeamToView(null)} titleId={viewModalTitleId}>
                {teamToView && (
                    <div className="p-2">
                        <h3 id={viewModalTitleId} className="text-xl font-bold text-gray-800 mb-4">{teamToView.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-700">ראשי צוות</h4>
                                {teamToView.leadIds.length > 0 ? (
                                    <ul className="list-disc list-inside mt-2 text-gray-600">
                                        {teamToView.leadIds.map(id => (
                                            <li key={id}>{usersMap.get(id)?.fullName || 'משתמש לא ידוע'}</li>
                                        ))}
                                    </ul>
                                ): <p className="text-gray-500 text-sm mt-1">אין ראשי צוות משויכים.</p>}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700">חברי צוות</h4>
                                {teamToView.memberIds.length > 0 ? (
                                    <ul className="list-disc list-inside mt-2 text-gray-600">
                                        {teamToView.memberIds.map(id => (
                                            <li key={id}>{usersMap.get(id)?.fullName || 'משתמש לא ידוע'}</li>
                                        ))}
                                    </ul>
                                ): <p className="text-gray-500 text-sm mt-1">אין חברים בצוות.</p>}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setTeamToView(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                סגור
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <ConfirmationModal 
                isOpen={!!teamToDelete} 
                onClose={() => setTeamToDelete(null)}
                onConfirm={confirmDeleteTeam}
                title="אישור מחיקת צוות"
                message={`האם אתה בטוח שברצונך למחוק את הצוות "${teamToDelete?.name}"?`}
            />
        </div>
    );
};

export default TeamSettings;