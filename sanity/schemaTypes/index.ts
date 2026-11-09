import { type SchemaTypeDefinition } from 'sanity'
import {tourPackage} from './tourPackage'
import { faq } from './faq'
import { gallery } from './gallery'
import { testimonial } from './testimonial'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [tourPackage, gallery, faq, testimonial]
}
