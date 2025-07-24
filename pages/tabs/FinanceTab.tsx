
import React, { useState, useEffect, useMemo, useId } from 'react';
import { Project, FinanceEntry, FinanceSummary, FinanceEntryType } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons';
import AddFinanceEntryForm from '../../components/AddFinanceEntryForm';

interface FinanceTabProps {
    projects: Project[];
    refreshData: () => void;
}

const StatCard = ({ title, value, colorClass = 'text-gray-900' }: { title: string, value: number, colorClass?: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-base font-semibold text-gray-500">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {value.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
    </div>
);

const FinanceTable = ({ title, entries }: { title: string, entries: FinanceEntry[] }) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[600px]">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3">תאריך</th>
                        <th scope="col" className="px-4 py-3">תיאור</th>
                        <th scope="col" className="px-4 py-3">פרויקט משויך</th>
                        <th scope="col" className="px-4 py-3">סכום</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(entry => (
                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-semibold">{new Date(entry.date).toLocaleDateString('he-IL')}</td>
                            <td className="px-4 py-3 text-gray-900 font-semibold">{entry.description}</td>
                            <td className="px-4 py-3 text-gray-900 font-semibold">{entry.projectTitle || 'כללי'}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{entry.amount.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</td>
                        </tr>
                    ))}
                    {entries.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-8 text-gray-500">אין נתונים להצגה</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const FinanceTab = ({ projects, refreshData }: FinanceTabProps) => {
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [entries, setEntries] = useState<FinanceEntry[]>([]);
    const [filteredProjectId, setFilteredProjectId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<FinanceEntryType>('INCOME');
    const addFinanceEntryModalTitleId = useId();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryData, entriesResponse] = await Promise.all([
                api.getFinanceSummary(filteredProjectId),
                api.getFinanceEntries(filteredProjectId),
            ]);
            setSummary(summaryData);
            setEntries(entriesResponse.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filteredProjectId]);

    const { incomeEntries, expenseEntries } = useMemo(() => {
        return {
            incomeEntries: entries.filter(e => e.type === 'INCOME'),
            expenseEntries: entries.filter(e => e.type === 'EXPENSE'),
        };
    }, [entries]);

    const openModal = (type: FinanceEntryType) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleAddEntry = async (data: Omit<FinanceEntry, 'id' | 'type' | 'projectTitle' | 'createdAt' | 'updatedAt'>) => {
        try {
            await api.createFinanceEntry({
                ...data,
                type: modalType,
            });
            setIsModalOpen(false);
            await fetchData(); // Refetch all data for the current view
        } catch (error) {
            console.error("Failed to add finance entry:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">טוען נתונים פיננסיים...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="project-filter-finance" className="text-sm font-medium text-gray-600 mr-2">הצג נתונים עבור:</label>
                    <select
                        id="project-filter-finance"
                        value={filteredProjectId}
                        onChange={(e) => setFilteredProjectId(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] p-2"
                    >
                        <option value="all">כל הארגון</option>
                        {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openModal('INCOME')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        <span>הוסף הכנסה</span>
                    </button>
                    <button onClick={() => openModal('EXPENSE')} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        <span>הוסף הוצאה</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="סך הכנסות" value={summary?.totalIncome ?? 0} colorClass="text-green-600" />
                <StatCard title="סך הוצאות" value={summary?.totalExpenses ?? 0} colorClass="text-red-600" />
                <StatCard
                    title="מאזן"
                    value={summary?.balance ?? 0}
                    colorClass={(summary?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                />
            </div>
            
            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinanceTable title="פירוט הכנסות" entries={incomeEntries} />
                <FinanceTable title="פירוט הוצאות" entries={expenseEntries} />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" titleId={addFinanceEntryModalTitleId}>
                <AddFinanceEntryForm
                    titleId={addFinanceEntryModalTitleId}
                    type={modalType}
                    projects={projects}
                    onCancel={() => setIsModalOpen(false)}
                    onSubmit={handleAddEntry}
                />
            </Modal>
        </div>
    );
};

export default FinanceTab;
