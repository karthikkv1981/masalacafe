import breakfast from "@/assets/cat-breakfast.jpg";
import appetizers from "@/assets/cat-appetizers.jpg";
import rice from "@/assets/cat-rice.jpg";
import curries from "@/assets/cat-curries.jpg";
import breads from "@/assets/cat-breads.jpg";
import indochinese from "@/assets/cat-indochinese.jpg";
import desserts from "@/assets/cat-desserts.jpg";
import drinks from "@/assets/cat-drinks.jpg";

import dishIdli from "@/assets/dish-idli.jpg";
import dishDosa from "@/assets/dish-dosa.jpg";
import dishVada from "@/assets/dish-vada.jpg";
import dishPongal from "@/assets/dish-pongal.jpg";
import dishUpma from "@/assets/dish-upma.jpg";
import dishChutney from "@/assets/dish-chutney.jpg";
import dishSambar from "@/assets/dish-sambar.jpg";
import dishAppam from "@/assets/dish-appam.jpg";
import dishPoori from "@/assets/dish-poori.jpg";
import dishSamosa from "@/assets/dish-samosa.jpg";
import dishPakoda from "@/assets/dish-pakoda.jpg";
import dishManchurian from "@/assets/dish-manchurian.jpg";
import dishChilliPaneer from "@/assets/dish-chilli-paneer.jpg";
import dishCutlet from "@/assets/dish-cutlet.jpg";
import dish65 from "@/assets/dish-65.jpg";
import dishBiryani from "@/assets/dish-biryani.jpg";
import dishLemonRice from "@/assets/dish-lemon-rice.jpg";
import dishCurdRice from "@/assets/dish-curd-rice.jpg";
import dishJeeraRice from "@/assets/dish-jeera-rice.jpg";
import dishPlainRice from "@/assets/dish-plain-rice.jpg";
import dishTamarindRice from "@/assets/dish-tamarind-rice.jpg";
import dishBisibele from "@/assets/dish-bisibele.jpg";
import dishFriedRice from "@/assets/dish-fried-rice.jpg";
import dishNoodles from "@/assets/dish-noodles.jpg";
import dishNaan from "@/assets/dish-naan.jpg";
import dishChapati from "@/assets/dish-chapati.jpg";
import dishParotta from "@/assets/dish-parotta.jpg";
import dishPaneerCurry from "@/assets/dish-paneer-curry.jpg";
import dishVegCurry from "@/assets/dish-veg-curry.jpg";
import dishDal from "@/assets/dish-dal.jpg";
import dishRasam from "@/assets/dish-rasam.jpg";
import dishPoriyal from "@/assets/dish-poriyal.jpg";
import dishHalwa from "@/assets/dish-halwa.jpg";
import dishGulabJamun from "@/assets/dish-gulab-jamun.jpg";
import dishPayasam from "@/assets/dish-payasam.jpg";
import dishLaddu from "@/assets/dish-laddu.jpg";
import dishCoffee from "@/assets/dish-coffee.jpg";
import dishChai from "@/assets/dish-chai.jpg";
import dishLassi from "@/assets/dish-lassi.jpg";
import dishCooler from "@/assets/dish-cooler.jpg";

export const categoryImages: Record<string, string> = {
  breakfast,
  appetizers,
  rice,
  curries,
  breads,
  "indo-chinese": indochinese,
  desserts,
  drinks,
};

export const fallbackImage = curries;

export function imageForCategory(slug: string) {
  return categoryImages[slug] ?? fallbackImage;
}

/** Ordered keyword rules — first match wins. */
const DISH_RULES: Array<[RegExp, string]> = [
  // breakfast
  [/idiyappam/, dishAppam],
  [/appam/, dishAppam],
  [/idli/, dishIdli],
  [/pesarattu|dosa/, dishDosa],
  [/vada/, dishVada],
  [/pongal/, dishPongal],
  [/kichadi|upma/, dishUpma],
  [/chutney/, dishChutney],
  [/sambar/, dishSambar],
  [/poori/, dishPoori],
  // appetizers / indo-chinese
  [/samosa/, dishSamosa],
  [/pakoda/, dishPakoda],
  [/manchurian/, dishManchurian],
  [/chilli/, dishChilliPaneer],
  [/cutlet/, dishCutlet],
  [/\b65\b/, dish65],
  [/noodles/, dishNoodles],
  [/fried rice/, dishFriedRice],
  // rice
  [/biryani/, dishBiryani],
  [/lemon rice|tomato rice/, dishLemonRice],
  [/curd rice/, dishCurdRice],
  [/jeera rice/, dishJeeraRice],
  [/tamarind|puliyodarai|coconut rice/, dishTamarindRice],
  [/bisi ?bele/, dishBisibele],
  [/steamed rice|plain rice/, dishPlainRice],
  // breads
  [/naan/, dishNaan],
  [/chapati|roti/, dishChapati],
  [/parotta|paratha/, dishParotta],
  // curries
  [/paneer/, dishPaneerCurry],
  [/dal |dal$|chana/, dishDal],
  [/rasam|kuzhambu/, dishRasam],
  [/poriyal|kootu|avial/, dishPoriyal],
  [/kurma|curry|masala/, dishVegCurry],
  // desserts
  [/halwa|kesari/, dishHalwa],
  [/gulab jamun|rasmalai/, dishGulabJamun],
  [/payasam/, dishPayasam],
  [/laddu|mysore pak/, dishLaddu],
  // drinks
  [/coffee/, dishCoffee],
  [/tea|chai/, dishChai],
  [/lassi|badam milk|rose milk/, dishLassi],
  [/lime|buttermilk|juice/, dishCooler],
];

export function imageForItem(name: string, categorySlug: string) {
  const key = name.toLowerCase();
  if (categorySlug === "desserts" && /pongal/.test(key)) return dishPayasam;
  for (const [pattern, image] of DISH_RULES) {
    if (pattern.test(key)) return image;
  }
  return imageForCategory(categorySlug);
}

export const ADDON_OPTIONS = [
  "Extra spicy",
  "Mild / no chili",
  "Jain (no onion & garlic)",
  "Extra chutney",
  "Serving utensils",
];
