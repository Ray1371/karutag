import type { Card } from "./Upload";


const MYSTIC_MOD:number = 0.9375;//mystic dye
const REGULAR_MOD:number = 0.25;//regular dye
const FRAME_MOD:number = 0.9375;
const TOUGHNESS_MOD:number = 0.05;
const WELLNESS_MOD:number = 0.25;
// const GRABBER_DROPPER_MOD: number = 0.1;//

//Quickness I guess can't be too clean.
const QUICKNESS_CONVERSION = (grade:string):number => {
  let mod:number = 0;
  switch(grade){
    case 'S':
      mod = 0.18;
      break;
    case 'A':
      mod = 0.14;
      break;
    case 'B':
      mod = 0.1;
      break;
    case 'C':
      mod = 0.06;
      break;
    case 'D':
      mod = 0.03;
      break;
    case 'F':
      break;
  }
  return mod; 
}

const GRABBER_MODDER_CONVERSION = (grade:string):number =>{
  return(grade == 'S' ? 0.1 : 0.0);
}

const PURITY_MOD:number = 0.0875;

//TODO: redo the modifiers at quality 4, since I never introduced purity yet.
const PURITY_CONVERSION = (grade:string):number => {
  let mod:number = 0;
  switch(grade){
    case 'S':
      mod = 4;
      break;
    case 'A':
      mod = 3;
      break;
    case 'B':
      mod = 2;
      break;
    case 'C':
      mod = 1;
      break;
    case 'F':
      break;
  }
  return mod; 
}



//todo; ROUND (nearest number, 0.5 would = 1) FOR EACH MOD
//todo: Put down disclaimer about potential inaccuracies
//TODO: ACCOUNT for dropper, grabber, purity, and quickness, as they have also been adding some numbers.
//TODO: need to account wellness as well; apparently adds 25% of ALL other stats, and after a bit of testing, seems to hold

//base = ((1-(burned/claimed) * (claimed/generated) * 101261). Clearly can't just find that in the data though.
export default function calcMaxEffort(card: Card): string {
    //for some reason stuff is returning 0 now.
    const quality = Number(card.quality);
    const initialEffort = Number(card.worker_effort);//where we started
    const toughnessGrade:string = card.worker_toughness || 'F';
    //Check if card is already fully upgraded; if so, return current effort.
    //Idk if I want to inform them.
    if(toughnessGrade === 'S' && card.frame && card.frame !== '' &&  card.dye_name?.includes('Mystic'))
        return String(initialEffort);

    //Get base value first, whether from upgrading or downgrading the card
    let baseEffort = deriveBaseValue(card);

    //# of upgrades for card to hit mint quality
    //UPGRADES DOUBLE THE BASE VALUE
    const qualityJumps:number = (4 - quality);

    //Upgrade card to mint; introduce new variable to track predicted effort
    let mintedEffort = Math.round(baseEffort  * Math.pow(2,qualityJumps));
    let predictedEffort = mintedEffort;//intent: use the base effort of the predicted new base effort

    
    
    //find new purity (mod). Lower grade by 1 for each upgrade needed
    const newPurityMult:number = PURITY_CONVERSION(card.worker_purity) - qualityJumps;

    //add the new purity mod
    //oops?: Before was just using the multiplier, but not using the modifier
    predictedEffort += Math.round(mintedEffort * (newPurityMult * PURITY_MOD));
    //add quickness mod
    predictedEffort += Math.round(mintedEffort * (QUICKNESS_CONVERSION(card.worker_quickness)));
    //add grabber and dropper mods
    predictedEffort += Math.round(mintedEffort * GRABBER_MODDER_CONVERSION(card.worker_grabber));
    predictedEffort += Math.round(mintedEffort * GRABBER_MODDER_CONVERSION(card.worker_dropper));
    //add toughness mod (assume toughness will be S)
    predictedEffort += Math.round(mintedEffort * (5*TOUGHNESS_MOD));
    //add frame mod
    predictedEffort += Math.round(mintedEffort * FRAME_MOD)
    //not sure if missing any steps, but from here split into the regular and mystic dye routes
    let predictedRegularDyeEffort = Math.round(
                                      predictedEffort +
                                      (mintedEffort * (REGULAR_MOD))
                                    );
    let predictedMysticDyeEffort = Math.round(
                                      predictedEffort +
                                      (mintedEffort * (MYSTIC_MOD))
                                    );
    //apply wellness mods for both routes
    predictedRegularDyeEffort *= Math.round((1 + WELLNESS_MOD));
    predictedMysticDyeEffort *= Math.round((1 + WELLNESS_MOD));
    //fudged by 5 percent to have in line with Keqing
    predictedMysticDyeEffort = Math.round(1.05 * predictedMysticDyeEffort);
    predictedRegularDyeEffort = Math.round(1.05 * predictedRegularDyeEffort);

    //Atm some values are still being inaccurate

    return String(
      predictedRegularDyeEffort +
      " (" +
      predictedMysticDyeEffort +
      ")"
    )
    ;



  //Quickness notes?
  //quickness seems to just add a flat value, so hard to really judge
  //Grade is merely a range, not absolute.
  //S =? 22 20% 19.5
  //A =? 17.56%? 18.07?


};



const getToughness = (grade: string): number => {
  const grades: Record<string, number> = {
    'F': 0,
    'D': 1,
    'C': 2,
    'B': 3,
    'A': 4,
    'S': 5
  };
  return grades[grade] ?? 0;
};
//Somehow I am not quite removing EVERY single source of additional effort, resulting in 
//33% more than expected / 3/4 of what is derived as base (idk how to word)
//I understand this will have some rounding issues, though I don't want to think on that;
//not after trying to do all of it the last time. 
const deriveBaseValue = (card:Card): number => {
  //get current/initial effort
  let initialEffort = Number(card.worker_effort);
  //Probably remove Wellness from equation since it is computed from ALL sources.
  // initialEffort -= Math.round(initialEffort * WELLNESS_MOD)
  initialEffort = Math.round(initialEffort / (1+WELLNESS_MOD));
  // initialEffort = Math.round(initialEffort * 0.8);
  //get style, purity, quickness, (vanity maybe later), grabber, dropper, toughness mods
  // const initialStyleMod = deriveStyleMod(card);
  const initialPurityMod = PURITY_CONVERSION(card.worker_purity) * PURITY_MOD;
  const initialQuicknessMod = QUICKNESS_CONVERSION(card.worker_quickness);
  const initialGrabberMod = GRABBER_MODDER_CONVERSION(card.worker_grabber);
  const initialDropperMod = GRABBER_MODDER_CONVERSION(card.worker_dropper);
  const toughnessGrade:string = card.worker_toughness || 'F';
  const initialToughnessMod = getToughness(toughnessGrade) * TOUGHNESS_MOD || 0;

  //try to subtract instead of just dividing?
  // initialEffort -= Math.round(initialEffort * initialStyleMod);
  // initialEffort -= Math.round(initialEffort * initialPurityMod);
  // initialEffort -= Math.round(initialEffort * initialQuicknessMod);
  // initialEffort -= (Math.round(initialEffort * initialGrabberMod));//grabber and dropper
  // initialEffort -= Math.round(initialEffort * initialDropperMod);
  // initialEffort -= Math.round(initialEffort * initialToughnessMod);

//So super low efforts get inflated due to eventually just straight adding effort into the equation
  initialEffort = Math.round(initialEffort / (1+initialPurityMod));
  if(card.dye_name && card.dye_name.includes('Mystic'))
    initialEffort = Math.round(initialEffort / (1+MYSTIC_MOD));
  else if(card.dye_name && !card.dye_name.includes('Mystic'))
    initialEffort = Math.round(initialEffort / (1+REGULAR_MOD));
  initialEffort = Math.round(initialEffort / (1+initialQuicknessMod));
  initialEffort = Math.round(initialEffort / (1+initialGrabberMod));
  initialEffort = Math.round(initialEffort / (1+initialDropperMod));
  initialEffort = Math.round(initialEffort / (1+initialToughnessMod));
  
//ball them up, and divide initial effort from that.
  // const initialModSum = initialStyleMod + 
  // initialPurityMod + 
  // initialQuicknessMod + 
  // initialGrabberMod + 
  // initialDropperMod + 
  // initialToughnessMod;
  // return Math.round(initialEffort / (1+initialModSum));
  return initialEffort;



  //get the current stats of the card (to compare against theoretical stats later)

}
//hope we correctly captured the dyeMod requirements this time
// const deriveStyleMod = (card:Card):number => {
//       let dyeMod:number = 0;
//       if(card.dye_name)
//         if(card.dye_name.includes('Mystic'))
//           dyeMod = MYSTIC_MOD;
//         else
//           dyeMod = REGULAR_MOD;
      
//       // const dyeMod:number = card.dye_name == '' ? (card.dye_name.includes('Mystic') ? MYSTIC_MOD : REGULAR_MOD) : 0;
//       const frameMod:number = (card.frame ? FRAME_MOD : 0);
//       return dyeMod + frameMod;
// }