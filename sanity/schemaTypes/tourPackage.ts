import {defineField, defineType} from 'sanity'

export const tourPackage = defineType({
  name: 'tourPackage',
  title: 'Tour Package',
  type: 'document',

  groups: [
    {name: 'packages', title: 'Overview', default: true},
    {name: 'packageModal', title: 'Details'},
  ],

  fields: [
    // =========================
    // 1. PACKAGES (CARD / CAROUSEL)
    // =========================

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'packages',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'days',
      title: 'Days',
      type: 'number',
      group: 'packages',
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'nights',
      title: 'Nights',
      type: 'number',
      group: 'packages',
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'packages',
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: 'unit',
      title: 'Price Unit',
      type: 'string',
      group: 'packages',
      initialValue: '/person',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'maxGroup',
      title: 'Maximum Group',
      type: 'number',
      group: 'packageModal',
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'groupSizeType',
      title: 'Group Size Type',
      type: 'string',
      options: {
        list: [
          { title: 'Maximum', value: 'max' },
          { title: 'Minimum', value: 'min' },
        ],
        layout: 'radio',
      },
      initialValue: 'max',
      group: 'packageModal',
    }),

    defineField({
      name: 'minAge',
      title: 'Minimum Age',
      type: 'number',
      group: 'packageModal',
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      group: 'packages',
      initialValue: 'Popular',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'metaDetail',
      title: 'Meta Detail',
      type: 'string',
      group: 'packages',
      initialValue: 'Say something unique about the package or its reviews',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      group: 'packages',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'packages',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    // =========================
    // 2. PACKAGE MODAL (DETAILS)
    // =========================

    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      group: 'packageModal',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
    }),

    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'packageModal',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'packageModal',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'includes',
      title: 'Includes',
      type: 'array',
      group: 'packageModal',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      group: 'packageModal',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'itinerary',
      title: 'Itinerary',
      type: 'array',
      group: 'packageModal',
      of: [
        {
          type: 'object',
          name: 'itineraryItem',
          fields: [
            defineField({
              name: 'day',
              title: 'Day',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            }),

            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'activities',
              title: 'Activities',
              type: 'array',
              of: [
                {
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
              ],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'day',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'whatsapp',
      title: 'WhatsApp Link',
      type: 'url',
      group: 'packageModal',
      validation: (Rule) => Rule.required().uri({
        scheme: ['http', 'https'],
      }),
    }),

    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      group: 'packageModal',
      options: {
        list: [
          {title: 'Easy', value: 'Easy'},
          {title: 'Medium', value: 'Medium'},
          {title: 'Hard', value: 'Hard'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      maxGroup: 'maxGroup',
      media: 'image',
    },
    prepare({title, maxGroup, media}) {
      return {
        title,
        subtitle: `${maxGroup} person`,
        media,
      }
    },
  },
})
