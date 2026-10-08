

export function LivingPlan({ stateData }: any) {
  const commitments = stateData.commitments;
  const maxPlanVersion = stateData.plans ? Math.max(0, ...stateData.plans.map((p:any) => p.version)) : 0;
  const proposedPlanEvent = stateData.events.filter((e: any) => e.type === 'PLAN_PROPOSED').slice(-1)[0];
  const activeVersion = proposedPlanEvent ? proposedPlanEvent.plan_version - 1 : maxPlanVersion;

  const sortedCommitments = [...commitments].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  if (commitments.length === 0) {
    return null; // Will show empty state in parent
  }

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
        <div className="section-title" style={{margin: 0}}>LIVING PLAN / 0{Math.max(1, activeVersion)}</div>
        <div className="badge">Today</div>
      </div>

      <div className="timeline">
        {sortedCommitments.map((c: any) => {
          const isMissed = c.status === 'missed';
          const isReplanned = c.status === 'proposed' || c.status === 'pending';
          
          return (
            <div key={c.id} className="timeline-item fade-in">
              <div className="timeline-time">
                {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className={`timeline-content ${isMissed ? 'missed' : isReplanned ? 'replanned' : ''}`}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <div className="headline">{c.title}</div>
                    <div className="metadata">{c.estimated_minutes ? `${c.estimated_minutes} MIN` : c.type.toUpperCase()}</div>
                  </div>
                  {isMissed && <span className="badge danger">MISSED</span>}
                  {isReplanned && <span className="badge warning">ACTIVE</span>}
                  {c.status === 'completed' && <span className="badge success">COMPLETED</span>}
                </div>
              </div>
            </div>
          );
        })}

        {proposedPlanEvent && (
          <>
            <div className="timeline-item fade-in" style={{paddingTop: '16px'}}>
              <div className="timeline-time"></div>
              <div className="metadata" style={{color: 'var(--accent-saffron)'}}>↓ CONTEXT CHANGED</div>
            </div>
            
            <div className="timeline-item fade-in slide-up">
              <div className="timeline-time">
                <span className="badge warning">NEW</span>
              </div>
              <div className="timeline-content replanned">
                <div className="section-title" style={{color: 'var(--accent-saffron)'}}>PLAN / 0{proposedPlanEvent.plan_version} PROPOSED</div>
                {(() => {
                  const plan = JSON.parse(proposedPlanEvent.new_state);
                  return (
                    <div className="body" style={{marginTop: '8px'}}>{plan.explanation}</div>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
