import type { FlightTmcAgent } from "@ryx/shared-types";

interface FlightBookAgentPickerProps {
  agents: FlightTmcAgent[];
  value?: string;
  onChange: (agentId: string) => void;
}

export function FlightBookAgentPicker({ agents, value, onChange }: FlightBookAgentPickerProps) {
  if (agents.length <= 1) return null;

  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="mb-2 text-[14px] font-medium text-[#333333]">服务商</p>
      <div className="space-y-2">
        {agents.map((agent) => {
          const agentId = String(agent.Id ?? "");
          const checked = value === agentId;
          return (
            <label
              key={agentId}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eeeeee] px-3 py-2.5"
            >
              <input
                type="radio"
                name="flight-agent"
                checked={checked}
                onChange={() => onChange(agentId)}
                className="size-4 accent-[#5099fe]"
              />
              {agent.LogoFullFileName ? (
                <img src={agent.LogoFullFileName} alt="" className="size-6 rounded object-contain" />
              ) : null}
              <span className="text-[14px] text-[#333333]">{agent.Name ?? agentId}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
