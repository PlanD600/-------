import React from 'react';
import * as api from '../../services/api';
import { Team, User } from '../../types';12

const MyTeamSettings = ({ teams, user, users }) => {
  const myLeadTeams = teams.filter(t => t.leadIds.includes(user.id));

  const handleAddMember = async (teamId: string, memberId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    await api.updateTeam(teamId, {
      name: team.name,
      leadIds: team.leadIds,
      memberIds: [...team.memberIds, memberId]
    });
    // רענון מידע וכו'
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    await api.updateTeam(teamId, {
      name: team.name,
      leadIds: team.leadIds,
      memberIds: team.memberIds.filter(id => id !== memberId)
    });
    // רענון מידע וכו'
  };

  return (
    <div>
      <h3>הצוותים שלי</h3>
      {myLeadTeams.map(team => (
        <div key={team.id}>
          <h4>{team.name}</h4>
          <ul>
            {team.memberIds.map(id =>
              <li key={id}>{users.find(u => u.id === id)?.fullName || 'לא ידוע'}
                {/* דוגמה לכפתור הוספה/הסרה */}
                <button onClick={() => handleAddMember(team.id, id)}>הוסף חבר</button>
                <button onClick={() => handleRemoveMember(team.id, id)}>הסר חבר</button>
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MyTeamSettings;