import React, { useState, useEffect, useMemo, useId } from 'react';
import { Project, FinanceEntry, FinanceSummary, FinanceEntryType } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/Modal';
import { PlusIcon, EditIcon, DeleteIcon, DownloadIcon, ResetIcon, RestoreIcon } from '../../components/icons';
import AddFinanceEntryForm from '../../components/AddFinanceEntryForm';
import EditFinanceEntryForm from '../../components/EditFinanceEntryForm';
import ConfirmationModal from '../../components/ConfirmationModal';

interface FinanceTabProps {
    projects: Project[];
    refreshData: () => void;
}

const isPdfEnabled = false; // ✨ החזרת כפתור הורדת PDF שנה ל-true✨

const StatCard = ({ title, value, colorClass = 'text-gray-900' }: { title: string, value: number, colorClass?: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-base font-semibold text-gray-500">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {value.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
    </div>
);

const FinanceTableWithHistory = ({ title, entriesByMonth, onEdit, onDelete }: { title: string, entriesByMonth: Record<string, FinanceEntry[]>, onEdit: (entry: FinanceEntry) => void, onDelete: (entry: FinanceEntry) => void }) => {
    const months = useMemo(() => Object.keys(entriesByMonth).sort().reverse(), [entriesByMonth]);

    if (months.length === 0) {
        return (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
                <p className="text-center py-8 text-gray-500">אין נתונים להצגה</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
            <div className="max-h-[500px] overflow-y-auto">
                {months.map(monthYear => (
                    <div key={monthYear} className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 sticky top-0 bg-white/80 backdrop-blur-sm z-10 p-2 -mx-2">
                            {new Date(monthYear).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })}
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right min-w-[800px]">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">תאריך</th>
                                        <th scope="col" className="px-4 py-3">תיאור</th>
                                        <th scope="col" className="px-4 py-3">פרויקט משויך</th>
                                        <th scope="col" className="px-4 py-3">סכום ברוטו</th>
                                        <th scope="col" className="px-4 py-3">מע"מ</th>
                                        <th scope="col" className="px-4 py-3">ניכויים</th>
                                        <th scope="col" className="px-4 py-3">סכום נטו</th>
                                        <th scope="col" className="px-4 py-3">סטטוס</th>
                                        <th scope="col" className="px-4 py-3 text-center">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entriesByMonth[monthYear].map(entry => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-semibold">{new Date(entry.date).toLocaleDateString('he-IL')}</td>
                                            <td className="px-4 py-3 text-gray-900 font-semibold">{entry.description}</td>
                                            <td className="px-4 py-3 text-gray-900 font-semibold">{entry.projectTitle || 'כללי'}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{(entry.amount ?? 0).toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{(entry.vatPercentage ?? 0).toFixed(2)}%</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{(entry.deductions ?? 0).toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{(entry.netAmount ?? 0).toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</td>
                                            <td className="px-4 py-3 text-gray-900 font-semibold">{entry.status || 'טרם שולם'}</td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button onClick={() => onEdit(entry)} className="text-blue-600 hover:text-blue-900 mx-1">
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => onDelete(entry)} className="text-red-600 hover:text-red-900 mx-1">
                                                    <DeleteIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FinanceTab = ({ projects, refreshData }: FinanceTabProps) => {
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [entries, setEntries] = useState<FinanceEntry[]>([]);
    const [filteredProjectId, setFilteredProjectId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<FinanceEntryType>('INCOME');
    const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
    const [deletingEntry, setDeletingEntry] = useState<FinanceEntry | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmRestore, setConfirmRestore] = useState(false);
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
        if (filteredProjectId !== 'all' && !projects.find(p => p.id === filteredProjectId)) {
            setFilteredProjectId('all');
        }
        fetchData();
    }, [projects, filteredProjectId]);

    const { incomeEntries, expenseEntries } = useMemo(() => {
        return {
            incomeEntries: entries.filter(e => e.type === 'INCOME'),
            expenseEntries: entries.filter(e => e.type === 'EXPENSE'),
        };
    }, [entries]);

    const groupEntriesByMonth = (entriesToGroup: FinanceEntry[]): Record<string, FinanceEntry[]> => {
        return entriesToGroup.reduce((acc, entry) => {
            const date = new Date(entry.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(entry);
            return acc;
        }, {} as Record<string, FinanceEntry[]>);
    };

    const groupedIncomeEntries = useMemo(() => groupEntriesByMonth(incomeEntries), [incomeEntries]);
    const groupedExpenseEntries = useMemo(() => groupEntriesByMonth(expenseEntries), [expenseEntries]);

    const openModal = (type: FinanceEntryType) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleAddEntry = async (data: Omit<FinanceEntry, 'id' | 'projectTitle' | 'createdAt' | 'updatedAt' | 'netAmount'>) => {
        try {
            await api.createFinanceEntry({
                ...data,
                type: modalType,
            });
            setIsModalOpen(false);
            await fetchData();
            refreshData();
        } catch (error) {
            console.error("Failed to add finance entry:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleEditEntry = async (updatedData: Partial<FinanceEntry>) => {
        if (!editingEntry) return;
        try {
            await api.updateFinanceEntry(editingEntry.id, updatedData);
            setEditingEntry(null);
            await fetchData();
            refreshData();
        } catch (error) {
            console.error("Failed to update finance entry:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleDeleteEntry = async () => {
        if (!deletingEntry) return;
        try {
            await api.deleteFinanceEntry(deletingEntry.id);
            setDeletingEntry(null);
            await fetchData();
            refreshData();
        } catch (error) {
            console.error("Failed to delete finance entry:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleResetFinances = async () => {
        if (!filteredProjectId || filteredProjectId === 'all') return;
        try {
            await api.resetProjectFinances(filteredProjectId);
            setConfirmReset(false);
            await fetchData();
            refreshData();
        } catch (error) {
            console.error("Failed to reset project finances:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleRestoreFinances = async () => {
        if (!filteredProjectId || filteredProjectId === 'all' || entries.length === 0) return;
        try {
            const entryToRestoreFrom = entries.find(e => e.projectId === filteredProjectId);
            if (!entryToRestoreFrom) {
                alert('אין רשומות כספים קיימות לשחזור תקציב מהן.');
                return;
            }
            await api.restoreProjectFinances(filteredProjectId, entryToRestoreFrom.id);
            setConfirmRestore(false);
            await fetchData();
            refreshData();
        } catch (error) {
            console.error("Failed to restore project finances:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };
    
    // 💡 פונקציה מעודכנת להורדת PDF
    const handleExportToPdf = async () => {
      try {
        const pdfBlob = await api.generateFinancePDF(filteredProjectId);
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finance-report-${new Date().toISOString()}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading PDF:', error);
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
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="project-filter-finance" className="text-sm font-medium text-gray-600 mr-2">הצג נתונים עבור:</label>
                    <select
                        id="project-filter-finance"
                        value={filteredProjectId}
                        onChange={(e) => setFilteredProjectId(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] p-2"
                    >
                        <option value="all">כל הפרויקטים</option>
                        {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {filteredProjectId !== 'all' && (
                        <>
                            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors">
                                <ResetIcon className="w-5 h-5" />
                                <span>אפס כספי פרויקט</span>
                            </button>
                            <button onClick={() => setConfirmRestore(true)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors" disabled={entries.filter(e => e.projectId === filteredProjectId).length === 0}>
                                <RestoreIcon className="w-5 h-5" />
                                <span>שחזר תקציב</span>
                            </button>
                        </>
                    )}
                    {isPdfEnabled && ( // ✨ התחלת התנאי ✨
                     <button onClick={handleExportToPdf} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                        <span>הורד PDF</span>
                    </button>
                    )} 

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summary && (
                    <>
                        <StatCard title="סך הכנסות" value={summary.totalIncome ?? 0} colorClass="text-green-600" />
                        <StatCard title="סך הוצאות" value={summary.totalExpenses ?? 0} colorClass="text-red-600" />
                        <StatCard
                            title="מאזן"
                            value={summary.balance ?? 0}
                            colorClass={(summary.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinanceTableWithHistory title="פירוט הכנסות" entriesByMonth={groupedIncomeEntries} onEdit={(entry) => setEditingEntry(entry)} onDelete={(entry) => setDeletingEntry(entry)} />
                <FinanceTableWithHistory title="פירוט הוצאות" entriesByMonth={groupedExpenseEntries} onEdit={(entry) => setEditingEntry(entry)} onDelete={(entry) => setDeletingEntry(entry)} />
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
            
            <Modal isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} size="md" titleId="edit-finance-entry-title">
                {editingEntry && (
                    <EditFinanceEntryForm
                        titleId="edit-finance-entry-title"
                        entry={editingEntry}
                        projects={projects}
                        onCancel={() => setEditingEntry(null)}
                        onSubmit={handleEditEntry}
                    />
                )}
            </Modal>

            <ConfirmationModal 
                isOpen={!!deletingEntry} 
                onClose={() => setDeletingEntry(null)} 
                onConfirm={handleDeleteEntry} 
                title="מחיקת רשומת כספים"
                message={`האם אתה בטוח שברצונך למחוק את הרשומה "${deletingEntry?.description}"?`}
            />

            <ConfirmationModal 
                isOpen={confirmReset} 
                onClose={() => setConfirmReset(false)} 
                onConfirm={handleResetFinances} 
                title="איפוס כספי הפרויקט"
                message={`האם אתה בטוח שברצונך לאפס את כל רשומות הכספים והתקציבים עבור פרויקט זה? פעולה זו הינה בלתי הפיכה.`}
            />
            
            <ConfirmationModal 
                isOpen={confirmRestore} 
                onClose={() => setConfirmRestore(false)} 
                onConfirm={handleRestoreFinances} 
                title="שחזור תקציב"
                message={`האם אתה בטוח שברצונך לשחזר את התקציב לפרויקט זה? פעולה זו תמחק את התקציב הקיים.`}
            />
        </div>
    );
};

export default FinanceTab;