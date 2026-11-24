import {report} from '../utils/telemetry.js';

export function createTeamEntryExpiry(teams,{intervalMs=60000,batchSize=25}={}){
    let timer,stopped=false,running=Promise.resolve();
    function run(){
        let delay=intervalMs;
        running=teams.expireEntries(batchSize)
            .then(({expired})=>{if(expired===batchSize)delay=1000;})
            .catch(error=>report('team_entry_expiry_failed',{error}))
            .finally(()=>{
                if(!stopped){timer=setTimeout(run,delay);timer.unref();}
            });
    }
    return {start:run,async close(){stopped=true;clearTimeout(timer);await running;}};
}
