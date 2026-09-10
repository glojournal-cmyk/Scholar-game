
/*
 V0.4 art activation switches.
 Keep FALSE until the corresponding final aligned PNG files are physically
 present in the repository. This avoids broken requests during image production.
*/
window.ScholarAvatarLayerConfig=Object.freeze({
  available:false,
  core:Object.freeze({
    backHair:'avatar_hair_back_long_brown.png',
    baseBody:'avatar_base_body.png',
    frontHair:'avatar_hair_front_long_brown.png'
  }),
  expressions:Object.freeze({
    happy:'expression_happy.png',
    focus:'expression_focus.png',
    proud:'expression_proud.png',
    surprised:'expression_surprised.png',
    tired:'expression_tired.png',
    celebrate:'expression_celebrate.png'
  }),
  outfits:Object.freeze({
    'green-cardigan':'outfit_green_cardigan.png',
    'garden-dress':'outfit_garden_dress.png',
    'formal-scholar':'outfit_formal_scholar.png',
    'french-academy':'outfit_french_academy.png'
  }),
  accessories:Object.freeze({beret:'accessory_beret_navy.png'}),
  handItems:Object.freeze({
    book:'handitem_book.png',
    scroll:'handitem_scroll.png',
    quill:'handitem_quill.png',
    flower:'handitem_flower.png',
    lantern:'handitem_lantern.png',
    magnifier:'handitem_magnifier.png'
  })
});

window.ScholarGardenGrowthConfig=Object.freeze({
  available:true,
  stages:Object.freeze({
    1:'garden_growth_01_seed.webp',
    2:'garden_growth_02_young.webp',
    3:'garden_growth_03_budding.webp',
    4:'garden_growth_04_bloom.webp'
  })
});
