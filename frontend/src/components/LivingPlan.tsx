

export function LivingPlan({ stateData }: any) {
  const plans = stateData.plans || [];
  const planBlocks = stateData.plan_blocks || [];

  if (plans.length === 0) {
    return null; 
  }

  // Get the most recent plan
  const latestPlan = plans[0];
  const blocksForPlan = planBlocks.filter((b: any) => b.plan_id === latestPlan.id);
  const isProposed = latestPlan.status === 'proposed';

  return (
      <div className="timeline">
        {blocksForPlan.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0', border: 'none' }}>
            <div className="metadata">No scheduled blocks in this plan.</div>
          </div>
        ) : (
          blocksForPlan.map((b: any) => {
            return (
              <div key={b.id} className="timeline-item fade-in">
                <div className="timeline-time" style={{ fontSize: '0.8rem', paddingTop: '4px' }}>
                  {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className={`timeline-content ${isProposed ? 'replanned' : ''} ${b.status === 'completed' ? 'success' : ''}`}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <div className="headline">{b.title}</div>
                      <div className="metadata">
                        {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <span className={`badge ${b.type === 'hard' ? 'danger' : 'success'}`}>{b.type.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {isProposed && (
           <div className="timeline-item fade-in slide-up" style={{ marginTop: '16px' }}>
             <div className="timeline-time">
               <span className="badge warning">NEW</span>
             </div>
             <div className="timeline-content replanned">
               <div className="section-title" style={{color: 'var(--accent-saffron)'}}>PLAN / 0{latestPlan.version} PROPOSED</div>
               <div className="body" style={{marginTop: '8px'}}>{latestPlan.reasoning}</div>
             </div>
           </div>
        )}
      </div>
  );
}
