import type { TeamMember } from '../types';

interface OrgNodeProps {
  member: TeamMember;
  color: 'sky' | 'emerald' | 'orange';
}

const colorMap = {
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
};

const dotColor = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
};

export default function OrgNode({ member, color }: OrgNodeProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorMap[color]}`}>
      <div className={`w-8 h-8 ${dotColor[color]} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{member.name}</p>
        <p className="text-xs opacity-70 truncate">{member.email}</p>
      </div>
      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
        member.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
      }`}>
        {member.status}
      </span>
    </div>
  );
}
