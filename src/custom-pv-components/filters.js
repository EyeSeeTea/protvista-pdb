import { scaleLinear } from "d3";
import cloneDeep from "lodash-es/cloneDeep";

import groupBy from "lodash-es/groupBy";
import flatten from "lodash-es/flatten";
import uniqBy from "lodash-es/uniqBy";
import forOwn from "lodash-es/forOwn";
import intersectionBy from "lodash-es/intersectionBy";

const scaleColours = {
  UPDiseaseColor: "#990000",
  UPNonDiseaseColor: "#99cc00",
  deleteriousColor: "#002594",
  benignColor: "#8FE3FF",
  othersColor: "#009e73"
};

const filterData = [
  {
    name: "disease",
    type: {
      name: "consequence",
      text: "Filter Consequence"
    },
    options: {
      labels: ["Likely disease"],
      colors: [scaleColours.UPDiseaseColor]
    }
  },
  {
    name: "predicted",
    type: {
      name: "consequence",
      text: "Filter Consequence"
    },
    options: {
      labels: ["Predicted deleterious", "Predicted benign"],
      colors: [scaleColours.deleteriousColor, scaleColours.benignColor]
    }
  },
  {
    name: "nonDisease",
    type: {
      name: "consequence",
      text: "Filter Consequence"
    },
    options: {
      labels: ["Likely benign"],
      colors: [scaleColours.UPNonDiseaseColor]
    }
  },
  {
    name: "uncertain",
    type: {
      name: "consequence",
      text: "Filter Consequence"
    },
    options: {
      labels: ["Uncertain"],
      colors: [scaleColours.othersColor]
    }
  },
  {
    name: "UniProt",
    type: {
      name: "provenance",
      text: "Filter Provenance"
    },
    options: {
      labels: ["UniProt reviewed"],
      colors: ["#e5e5e5"]
    }
  },
  {
    name: "ClinVar",
    type: {
      name: "provenance",
      text: "Filter Provenance"
    },
    options: {
      labels: ["ClinVar reviewed"],
      colors: ["#e5e5e5"]
    }
  },
  {
    name: "LSS",
    type: {
      name: "provenance",
      text: "Filter Provenance"
    },
    options: {
      labels: ["Large scale studies"],
      colors: ["#e5e5e5"]
    }
  },
  {
    name: "FoldX",
    type: {
      name: "provenance",
      text: "Filter Provenance"
    },
    options: {
      labels: ["FoldX analysis"],
      colors: ["#e5e5e5"]
    }
  },
  {
    name: "PDB",
    type: {
      name: "provenance",
      text: "Filter Provenance"
    },
    options: {
      labels: ["Observed in PDB"],
      colors: ["#e5e5e5"]
    }
  }
];

const keywordMap = {
  disease: 'likely_disease',
  predicted: 'predicted',
  nonDisease: 'likely_benign',
  uncertain: 'uncertain',
  UniProt: 'uniprot_reviewed',
  ClinVar: 'clinvar_reviewed',
  LSS: 'large_scale_studies',
  FoldX: 'foldx',
  PDB: 'pdb'
}

const applyFilter = (filterName, variants = []) => {
  const clonedVariants = cloneDeep(variants) || [];
  const filterKeyword = keywordMap[filterName];
  return clonedVariants.filter(
    variant => {
      return (variant.keywords && (
        variant.keywords.indexOf(filterKeyword) > -1 ||
        // Check also filterName, so we can also filter by keywords not hardcoded in keywordMap.
        variant.keywords.indexOf(filterName) > -1)
      )
    }
  );
}

const identity = variants => variants;

export const getFilter = name => {
  // console.log(filters)
  const filter = filters[name];
  if (!filter) {
    console.error(`No filter found for: ${name}`);
  }
  return filter ? filter : { applyFilter: identity };
};

const filterVariants = (filterName, variants) =>
  { return applyFilter(filterName, variants) };

export const _union = (variants, filterNames, key) => {
  return uniqBy(
    flatten(
      filterNames
        .map(name => name.split(":")[1])
        .map(name => { return filterVariants(name, variants)})
    ),
    v => v[key]
  );
};

export const _getFilteredDataSet = (attrName, oldVal, newVal, dataset) => {

  const { sequence, variants } = dataset;
      newVal = newVal.trim();
      if (!newVal) {
        return { sequence, variants: variants };
      }
      const filterNames = newVal.split(",");
      const groupByFilterCategory = groupBy(filterNames, attrName => {
        return attrName.split(":")[0];
      });

      let filteredVariants = [];
      forOwn(groupByFilterCategory, filterNames => {
        const filteredValuesByCategory = _union(
          variants,
          filterNames,
          "accession"
        );
        filteredVariants.push(filteredValuesByCategory);
      });
      filteredVariants = flatten(
        intersectionBy(...filteredVariants, variant => variant.accession)
      );

      filteredVariants = uniqBy(filteredVariants, "accession");
      return { sequence, variants: filteredVariants };

}

export default filterData;
