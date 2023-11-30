var artifactLevel=0;

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'ArtifactDropEfficiency',
  pluginDescription: 'SWEXArtifact by Kiyyun. Logs the maximum possible efficiency for artifacts as they drop and are upgraded. Adapted from rune-drop-efficiency by Xzandro.',
  init(proxy) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp);
      }
    });
  },
  processCommand(proxy, req, resp) {
    const { command } = req;
    let artifactsInfo = [];

    // Extract the artifact and display it's efficiency stats.
    switch (command) {
      case 'BattleDungeonResult_V2':
        if (resp.win_lose === 1) {
          const rewards = resp.changed_item_list ? resp.changed_item_list : [];

          if (rewards) {
            rewards.forEach(reward => {
              if (reward.type === 73) {
                artifactsInfo.push(this.logartifactDrop(reward.info));
              }
            });
          }
        }
        break;
      case 'UpgradeArtifact': {
        const newLevel = resp.artifact.level;

        if (newLevel > artifactLevel && newLevel % 3 === 0 && newLevel <= 12) {
          artifactsInfo.push(this.logartifactDrop(resp.artifact));
        }
		artifactLevel = newLevel;
        break;
      }
	  case 'ConfirmArtifactConversion': {
          artifactsInfo.push(this.logartifactDrop(resp.artifact));
        break;
      }

    }

    if (artifactsInfo.length > 0) {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: this.mountartifactListHtml(artifactsInfo)
      });
    }
  },

  logartifactDrop(artifact) {
	  try{
			const efficiency = this.getArtifactEfficiency(artifact);
			const artifactQuality = artifact.rank;
			const artifactType = this.getArtifactTypeName(artifact.type);
			let artifactCategory = this.getArtifactUnitStyleName(artifact.unit_style)=="" ? this.getArtifactAttributeName(artifact.attribute) : this.getArtifactUnitStyleName(artifact.unit_style);
			const artifactMainStat = this.getArtifactMainStatAttribute(artifact.pri_effect[0]);
			const artifactMainStatValue = artifact.pri_effect[1];
			const colorTable = {
			  1: 'grey', //Common
			  2: 'green', //Magic
			  3: 'blue',  	//Rare
			  4: 'purple',	//Hero
			  5: 'orange'	//Legend
			};

			let color = colorTable[artifactQuality];

			let artifactEffectsHTML = this.mountArtifactEffects(artifact);

			return `<div class="rune item" style:"font-size=11px">
					  <div class="ui image ${color} label">
						<div class="category">${artifactCategory}</div>
						<div class ="mainstat">${artifactMainStat}:${artifactMainStatValue}</div>
						<span class="upgrade">+${artifact.level}</span>  
					  </div>

					  <div class="content">
						${artifactEffectsHTML}
						<div class="description">Efficiency: ${efficiency.current}%. ${artifact.level < 12 ? `Max: ${efficiency.max}%` : ''}</div>
					  </div>
					</div>`;
		  } catch (e) {
			//proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: `LogArtifactDrop-${e.message}` });
      }
	  }
		  ,
  mountArtifactEffects(artifact) {
	let count = 0;
	let html = '<div class="effects-line">';
	artifact.sec_effects.forEach(stat => {
			effectDescription = this.getArtifactSubStatAttributeName(stat[0]);
			if(effectDescription!="Unknown"){
				value = stat[1];
				html= html.concat(`<div class="effect">${value}: ${effectDescription}</div>`);
			}
		});

	return html.concat('</div>');
		
  },
  getArtifactEfficiency(artifact, toFixed = 2) {
    let ratio = 0.0;

    artifact.sec_effects.forEach(stat => {
			max = this.getArtifactSubStatMaxAttribute(stat[0]);
			value = stat[1];
			ratio += value / max;
    });

    let efficiency = (ratio / 1.6) * 100;

    return {
      current: ((ratio / 1.6) * 100).toFixed(toFixed),
      max: (efficiency + ((Math.max(Math.ceil((12 - artifact.level) / 3.0), 0) * 0.2) / 1.6) * 100).toFixed(toFixed)
    };
  },

  mountartifactListHtml(artifacts) {
    let message = '<div class="artifacts ui list relaxed">';

    artifacts.forEach(artifact => {
      message = message.concat(artifact);
    });

    return message.concat('</div>');
  },
  
  getArtifactTypeName(artifactType){
		switch(artifactType){
			case 1: return "Attribute Artifact";
			case 2: return "Type Artifact";
			case 3: return "Intangible";
		}
		return "";
	},
	
	getArtifactAttributeName(artifactAttribute){
		switch(artifactAttribute){
			case 1: return "Water";
			case 2: return "Fire";
			case 3: return "Wind";
			case 4: return "Light";
			case 5: return "Dark";
			case 6: return "Intangible";
		}
		return "";
	},
	
	getArtifactUnitStyleName(artifactUnitStyle){
		switch(artifactUnitStyle){
			case 1: return "Attack";
			case 2: return "Defense";
			case 3: return "HP";
			case 4: return "Support";
			case 5: return "Intangible";
		}
		return "";
	},
	
	getArtifactMainStatMaxAttribute(attribute_id){
		switch(attribute_id){
			case 100: //HP
				return 1500;
			case 101: //ATK
				return 100;
			case 102: //DEF
				return 100;
		}
		return 0;
	},
	getArtifactMainStatAttribute(attribute_id){
		switch(attribute_id){
			case 100: //HP
				return "HP";
			case 101: //ATK
				return "ATK";
			case 102: //DEF
				return "DEF";
		}
		return 0;
	},
	
	getArtifactSubStatAttributeName(attribute_id){

		switch(attribute_id){
			case 200: 
				return "ATK Increased Proportional to Lost HP up to X%";
			case 201:
				return "DEF Increased Proportional to Lost HP up to X%";
			case 202:
				return "SPD Increased Proportional to Lost HP up to X%";
			case 203:
				return "SPD Under Inability Effects +X%";
			case 204:
				return "ATK Increasing Effect +X%";
			case 205:
				return "DEF Increasing Effect +X%";
			case 206:
				return "SPD Increasing Effect +X%";
			case 207:
				return "Crit Rate Increasing Effect +X%";
			case 208:
				return "Damage Dealt by Counterattack +X%";
			case 209:
				return "Damage Dealt by Attacking Together +X%";
			case 210:
				return "Bomb Damage +X%";
			case 211:
				return "Damage Dealt by Reflected DMG +X%";
			case 212:
				return "Crushing Hit DMG +X%";
			case 213:
				return "Damage Received Under Inability Effect -X%";
			case 214:
				return "Received Crit DMG -X%";
			case 215:
				return "Life Drain +X%";
			case 216:
				return "HP when Revived +X%";
			case 217:
				return "Attack Bar when Revived +X%";
			case 218:
				return "Additional Damage by X% of HP";
			case 219:
				return "Additional Damage by X% of ATK";
			case 220:
				return "Additional Damage by X% of DEF";
			case 221:
				return "Additional Damage by X% of SPD";
			case 222:
				return "CRIT DMG+ up to X% as the enemy's HP condition is good";
			case 223:
				return "CRIT DMG+ up to X% as the enemy's HP condition is bad";
			case 224:
				return "Single-target skill CRIT DMG X% on your turn";
			case 225:
				return "Counterattack/Co-op Attack DMG +X%";
			case 226:
				return "ATK/DEF UP Effect +X%";
			case 300:
				return "Damage Dealt on Fire +X%";
			case 301:
				return "Damage Dealt on Water +X%";
			case 302:
				return "Damage Dealt on Wind +X%";
			case 303:
				return "Damage Dealt on Light +X%";
			case 304:
				return "Damage Dealt on Dark +X%";
			case 305:
				return "Damage Received from Fire -X%";
			case 306:
				return "Damage Received from Water -X%";
			case 307:
				return "Damage Received from Wind -X%";
			case 308:
				return "Damage Received from Light -X%";
			case 309:
				return "Damage Received from Dark -X%";
			case 400:
				return "Skill 1 CRIT DMG +X%";
			case 401:
				return "Skill 2 CRIT DMG +X%";
			case 402:
				return "Skill 3 CRIT DMG +X%";
			case 403:
				return "Skill 4 CRIT DMG +X%";
			case 404:
				return "Skill 1 Recovery +X%";
			case 405:
				return "Skill 2 Recovery +X%";
			case 406:
				return "Skill 3 Recovery +X%";
			case 407:
				return "Skill 1 Accuracy +X%";
			case 408:
				return "Skill 2 Accuracy +X%";
			case 409:
				return "Skill 3 Accuracy +X%";
			case 410:
				return "[Skill 3/4] CRIT DMG +X%";
			case 411:
				return "First Attack CRIT DMG +X%";
		}
		return "Unknown";
	},
	
	getArtifactSubStatMaxAttribute(attribute_id){

		switch(attribute_id){
			case 200: //ATK Increased Proportional to Lost HP up to ${value}%
				return 70.0;
			case 201: //DEF Increased Proportional to Lost HP up to ${value}%
				return 70.0;
			case 202: //SPD Increased Proportional to Lost HP up to ${value}%
				return 70.0;
			case 203: //SPD Under Inability Effects +${value}%
				return 30.0;
			case 204: //ATK Increasing Effect +${value}%
				return 25.0;
			case 205: //DEF Increasing Effect +${value}%
				return 20.0;
			case 206: //SPD Increasing Effect +${value}%
				return 30.0;
			case 207: //Crit Rate Increasing Effect +${value}%
				return 30.0;
			case 208: //Damage Dealt by Counterattack +${value}%
				return 20.0;
			case 209: //Damage Dealt by Attacking Together +${value}%
				return 20.0;
			case 210: //Bomb Damage +${value}%
				return 20.0;
			case 211: //Damage Dealt by Reflected DMG +${value}%
				return 15.0;
			case 212: //Crushing Hit DMG +${value}%
				return 20.0;
			case 213: //Damage Received Under Inability Effect -${value}%
				return 15.0;
			case 214: //Received Crit DMG -${value}%
				return 20.0;
			case 215: //Life Drain +${value}%
				return 40.0;
			case 216: //HP when Revived +${value}%
				return 30.0;
			case 217: //Attack Bar when Revived +${value}%
				return 30.0;
			case 218: //Additional Damage by ${value}% of HP
				return 1.5;
			case 219: //Additional Damage by ${value}% of ATK
				return 20.0;
			case 220: //Additional Damage by ${value}% of DEF
				return 20.0;
			case 221: //Additional Damage by ${value}% of SPD
				return 200.0;
			case 222: //CRIT DMG+ up to X% as the enemy's HP condition is good
				return 30.0;
			case 223: //CRIT DMG+ up to X% as the enemy's HP condition is bad
				return 60.0;
			case 224: //Single-target skill CRIT DMG X% on your turn
				return 20.0;
			case 225:
				return 20.0;//"Counterattack/Co-op Attack DMG +${value}%";
			case 226:
				return 25.0;//"ATK/DEF UP Effect +${value}%";
			case 300: //Damage Dealt on Fire +${value}%
				return 25.0;
			case 301: //Damage Dealt on Water +${value}%
				return 25.0;
			case 302: //Damage Dealt on Wind +${value}%
				return 25.0;
			case 303: //Damage Dealt on Light +${value}%
				return 25.0;
			case 304: //Damage Dealt on Dark +${value}%
				return 25.0;
			case 305: //Damage Received from Fire -${value}%
				return 30.0;
			case 306: //Damage Received from Water -${value}%
				return 30.0;
			case 307: //Damage Received from Wind -${value}%
				return 30.0;
			case 308: //Damage Received from Light -${value}%
				return 30.0;
			case 309: //Damage Received from Dark -${value}%
				return 30.0;
			case 400: //Skill 1 CRIT DMG +${value}%
				return 30.0;
			case 401: //Skill 2 CRIT DMG +${value}%
				return 30.0;
			case 402: //Skill 3 CRIT DMG +${value}%
				return 30.0;
			case 403: //Skill 4 CRIT DMG +${value}%
				return 30.0;
			case 404: //Skill 1 Recovery +${value}%
				return 30.0;
			case 405: //Skill 2 Recovery +${value}%
				return 30.0;
			case 406: //Skill 3 Recovery +${value}%
				return 30.0;
			case 407: //Skill 1 Accuracy +${value}%
				return 30.0;
			case 408: //Skill 2 Accuracy +${value}%
				return 30.0;
			case 409: //Skill 3 Accuracy +${value}%
				return 30.0;
			case 410:
				return 30;//"[Skill 3/4] CRIT DMG +${value}%";
			case 411:
				return 30;//"First Attack CRIT DMG +${value}%";
		}
		return 0;
	}
};
