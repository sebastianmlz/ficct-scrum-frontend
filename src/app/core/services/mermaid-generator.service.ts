import {Injectable} from '@angular/core';

/**
 * Service to generate Mermaid.js class diagram syntax from UML data
 */
@Injectable({
  providedIn: 'root',
})
export class MermaidGeneratorService {
  /**
   * Generate Mermaid class diagram syntax from classes and relationships
   */
  generateClassDiagram(classes: any[], relationships: any[]): string {
    let mermaid = 'classDiagram\n';

    // Generate class definitions
    for (const cls of classes) {
      mermaid += this.generateClassDefinition(cls);
    }

    // Generate relationships
    if (relationships && relationships.length > 0) {
      mermaid += '\n';
      for (const rel of relationships) {
        mermaid += this.generateRelationship(rel);
      }
    }

    return mermaid;
  }

  /**
   * Generate individual class definition
   */
  private generateClassDefinition(cls: any): string {
    let definition = `    class ${this.sanitizeClassName(cls.name)} {\n`;

    // Add attributes (NO emojis, clean format)
    if (cls.attributes && cls.attributes.length > 0) {
      for (const attr of cls.attributes) {
        const visibility = attr.required ? '+' : '-';
        const pkMarker = attr.primary_key ? ' PK' : '';
        definition += `        ${visibility}${attr.name} ${attr.type}${pkMarker}\n`;
      }
    }

    // Add methods (NO emojis, clean format)
    if (cls.methods && cls.methods.length > 0) {
      for (const method of cls.methods) {
        const visibility = method.visibility === 'public' ? '+' : '-';
        definition += `        ${visibility}${method.name}()\n`;
      }
    }

    definition += `    }\n\n`;

    return definition;
  }

  /**
   * Generate relationship between classes
   */
  private generateRelationship(rel: any): string {
    const arrow = this.getArrowType(rel.type);
    const fromClass = this.sanitizeClassName(rel.from);
    const toClass = this.sanitizeClassName(rel.to);

    return `    ${fromClass} ${arrow} ${toClass}\n`;
  }

  /**
   * Get Mermaid arrow type based on relationship type
   */
  private getArrowType(type: string): string {
    const arrowMap: Record<string, string> = {
      'many_to_one': '-->',
      'one_to_many': '<--',
      'many_to_many': 'o--o',
      'one_to_one': '--',
      'uses': '..>',
      'accesses': '-->',
      'extends': '--|>',
      'implements': '..|>',
      'aggregation': 'o--',
      'composition': '*--',
    };

    return arrowMap[type] || '-->';
  }

  /**
   * Sanitize class name for Mermaid (remove special chars, spaces)
   */
  private sanitizeClassName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
