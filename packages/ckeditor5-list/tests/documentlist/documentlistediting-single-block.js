/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import DocumentListEditing from '../../src/documentlist/documentlistediting';

import BoldEditing from '@ckeditor/ckeditor5-basic-styles/src/bold/boldediting';
import UndoEditing from '@ckeditor/ckeditor5-undo/src/undoediting';
import ClipboardPipeline from '@ckeditor/ckeditor5-clipboard/src/clipboardpipeline';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';
import HeadingEditing from '@ckeditor/ckeditor5-heading/src/headingediting';
import IndentEditing from '@ckeditor/ckeditor5-indent/src/indentediting';
import TableEditing from '@ckeditor/ckeditor5-table/src/tableediting';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import { getData as getModelData, parse as parseModel, setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

import ListEditing from '../../src/list/listediting';
import DocumentListIndentCommand from '../../src/documentlist/documentlistindentcommand';
import DocumentListSplitCommand from '../../src/documentlist/documentlistsplitcommand';

import stubUid from './_utils/uid';
import { modelList, prepareTest } from './_utils/utils';

describe( 'DocumentListEditing (multiBlock=false)', () => {
	let editor, model, modelDoc, modelRoot, view;

	testUtils.createSinonSandbox();

	beforeEach( async () => {
		editor = await VirtualTestEditor.create( {
			list: {
				multiBlock: false
			},
			plugins: [ Paragraph, ClipboardPipeline, BoldEditing, DocumentListEditing, UndoEditing,
				BlockQuoteEditing, TableEditing, HeadingEditing ]
		} );

		model = editor.model;
		modelDoc = model.document;
		modelRoot = modelDoc.getRoot();

		view = editor.editing.view;

		model.schema.extend( 'paragraph', {
			allowAttributes: 'foo'
		} );

		// Stub `view.scrollToTheSelection` as it will fail on VirtualTestEditor without DOM.
		sinon.stub( view, 'scrollToTheSelection' ).callsFake( () => {} );
		stubUid();
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'should set proper schema rules', () => {
		expect( model.schema.checkAttribute( [ '$root', 'listItem' ], 'listItemId' ) ).to.be.true;
		expect( model.schema.checkAttribute( [ '$root', 'listItem' ], 'listIndent' ) ).to.be.true;
		expect( model.schema.checkAttribute( [ '$root', 'listItem' ], 'listType' ) ).to.be.true;
		expect( model.schema.checkAttribute( [ '$root', 'paragraph' ], 'listItemId' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'paragraph' ], 'listIndent' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'paragraph' ], 'listType' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'heading1' ], 'listItemId' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'heading1' ], 'listIndent' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'heading1' ], 'listType' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'blockQuote' ], 'listItemId' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'blockQuote' ], 'listIndent' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'blockQuote' ], 'listType' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'table' ], 'listItemId' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'table' ], 'listIndent' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'table' ], 'listType' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'tableCell' ], 'listItemId' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'tableCell' ], 'listIndent' ) ).to.be.false;
		expect( model.schema.checkAttribute( [ '$root', 'tableCell' ], 'listType' ) ).to.be.false;
	} );

	describe( 'commands', () => {
		it( 'should register indent list command', () => {
			const command = editor.commands.get( 'indentList' );

			expect( command ).to.be.instanceOf( DocumentListIndentCommand );
		} );

		it( 'should register outdent list command', () => {
			const command = editor.commands.get( 'outdentList' );

			expect( command ).to.be.instanceOf( DocumentListIndentCommand );
		} );

		it( 'should register the splitListItemBefore command', () => {
			const command = editor.commands.get( 'splitListItemBefore' );

			expect( command ).to.be.instanceOf( DocumentListSplitCommand );
		} );

		it( 'should register the splitListItemAfter command', () => {
			const command = editor.commands.get( 'splitListItemAfter' );

			expect( command ).to.be.instanceOf( DocumentListSplitCommand );
		} );

		it( 'should add indent list command to indent command', async () => {
			const editor = await VirtualTestEditor.create( {
				plugins: [ Paragraph, IndentEditing, DocumentListEditing ]
			} );

			const indentListCommand = editor.commands.get( 'indentList' );
			const indentCommand = editor.commands.get( 'indent' );

			const spy = sinon.stub( indentListCommand, 'execute' );

			indentListCommand.isEnabled = true;
			indentCommand.execute();

			sinon.assert.calledOnce( spy );

			await editor.destroy();
		} );

		it( 'should add outdent list command to outdent command', async () => {
			const editor = await VirtualTestEditor.create( {
				plugins: [ Paragraph, IndentEditing, DocumentListEditing ]
			} );

			const outdentListCommand = editor.commands.get( 'outdentList' );
			const outdentCommand = editor.commands.get( 'outdent' );

			const spy = sinon.stub( outdentListCommand, 'execute' );

			outdentListCommand.isEnabled = true;
			outdentCommand.execute();

			sinon.assert.calledOnce( spy );

			await editor.destroy();
		} );
	} );

	describe( 'post fixer', () => {
		describe( 'insert', () => {
			// TODO: insert the same listItemId and check it's fixed.
		} );

		describe( 'move', () => {
			// eslint-disable-next-line no-unused-vars
			function testList( input, offset, output ) {
				const selection = prepareTest( model, input );

				model.change( writer => {
					const targetPosition = writer.createPositionAt( modelRoot, offset );

					writer.move( selection.getFirstRange(), targetPosition );
				} );

				expect( getModelData( model, { withoutSelection: true } ) ).to.equal( output );
			}

			// TODO: insert the same listItemId and check it's fixed.
		} );

		describe( 'rename', () => {
			it( 'to element that does not allow list attributes', () => {
				const modelBefore =
					'<listItem listIndent="0" listItemId="a" listType="bulleted">a</listItem>' +
					'<listItem listIndent="1" listItemId="b" listType="bulleted">b</listItem>' +
					'[<listItem listIndent="2" listItemId="c" listType="bulleted" foo="123">c</listItem>]' +
					'<listItem listIndent="2" listItemId="d" listType="bulleted">d</listItem>' +
					'<listItem listIndent="3" listItemId="e" listType="bulleted">e</listItem>' +
					'<listItem listIndent="1" listItemId="f" listType="bulleted">f</listItem>' +
					'<listItem listIndent="2" listItemId="g" listType="bulleted">g</listItem>' +
					'<listItem listIndent="1" listItemId="h" listType="bulleted">h</listItem>' +
					'<listItem listIndent="2" listItemId="i" listType="bulleted">i</listItem>';

				const expectedModel =
					'<listItem listIndent="0" listItemId="a" listType="bulleted">a</listItem>' +
					'<listItem listIndent="1" listItemId="b" listType="bulleted">b</listItem>' +
					'<paragraph foo="123">c</paragraph>' +
					'<listItem listIndent="0" listItemId="d" listType="bulleted">d</listItem>' +
					'<listItem listIndent="1" listItemId="e" listType="bulleted">e</listItem>' +
					'<listItem listIndent="0" listItemId="f" listType="bulleted">f</listItem>' +
					'<listItem listIndent="1" listItemId="g" listType="bulleted">g</listItem>' +
					'<listItem listIndent="0" listItemId="h" listType="bulleted">h</listItem>' +
					'<listItem listIndent="1" listItemId="i" listType="bulleted">i</listItem>';

				const selection = prepareTest( model, modelBefore );

				model.change( writer => {
					writer.rename( selection.getFirstPosition().nodeAfter, 'paragraph' );
				} );

				expect( getModelData( model, { withoutSelection: true } ) ).to.equal( expectedModel );
			} );
		} );

		describe( 'changing list attributes', () => {
			it( 'remove list attributes', () => {
				const modelBefore =
					'<listItem listIndent="0" listItemId="a" listType="bulleted">a</listItem>' +
					'<listItem listIndent="1" listItemId="b" listType="bulleted">b</listItem>' +
					'[<listItem listIndent="2" listItemId="c" listType="bulleted">c</listItem>]' +
					'<listItem listIndent="2" listItemId="d" listType="bulleted">d</listItem>' +
					'<listItem listIndent="3" listItemId="e" listType="bulleted">e</listItem>' +
					'<listItem listIndent="1" listItemId="f" listType="bulleted">f</listItem>' +
					'<listItem listIndent="2" listItemId="g" listType="bulleted">g</listItem>' +
					'<listItem listIndent="1" listItemId="h" listType="bulleted">h</listItem>' +
					'<listItem listIndent="2" listItemId="i" listType="bulleted">i</listItem>';

				const expectedModel =
					'<listItem listIndent="0" listItemId="a" listType="bulleted">a</listItem>' +
					'<listItem listIndent="1" listItemId="b" listType="bulleted">b</listItem>' +
					// TODO
					'<listItem>c</listItem>' +
					'<listItem listIndent="0" listItemId="d" listType="bulleted">d</listItem>' +
					'<listItem listIndent="1" listItemId="e" listType="bulleted">e</listItem>' +
					'<listItem listIndent="0" listItemId="f" listType="bulleted">f</listItem>' +
					'<listItem listIndent="1" listItemId="g" listType="bulleted">g</listItem>' +
					'<listItem listIndent="0" listItemId="h" listType="bulleted">h</listItem>' +
					'<listItem listIndent="1" listItemId="i" listType="bulleted">i</listItem>';

				const selection = prepareTest( model, modelBefore );
				const element = selection.getFirstPosition().nodeAfter;

				model.change( writer => {
					writer.removeAttribute( 'listItemId', element );
					writer.removeAttribute( 'listIndent', element );
					writer.removeAttribute( 'listType', element );
				} );

				expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup( expectedModel );
			} );

			// TODO: What to do?
			it.skip( 'add list attributes', () => {
				const modelBefore =
					'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
					'<paragraph listIndent="1" listItemId="b" listType="bulleted">b</paragraph>' +
					'[<paragraph>c</paragraph>]' +
					'<paragraph listIndent="0" listItemId="d" listType="bulleted">d</paragraph>' +
					'<paragraph listIndent="1" listItemId="e" listType="bulleted">e</paragraph>' +
					'<paragraph listIndent="2" listItemId="f" listType="bulleted">f</paragraph>' +
					'<paragraph listIndent="1" listItemId="g" listType="bulleted">g</paragraph>';

				const expectedModel =
					'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
					'<paragraph listIndent="1" listItemId="b" listType="bulleted">b</paragraph>' +
					'<paragraph listIndent="2" listItemId="c" listType="bulleted">c</paragraph>' +
					'<paragraph listIndent="2" listItemId="d" listType="bulleted">d</paragraph>' +
					'<paragraph listIndent="1" listItemId="e" listType="bulleted">e</paragraph>' +
					'<paragraph listIndent="2" listItemId="f" listType="bulleted">f</paragraph>' +
					'<paragraph listIndent="1" listItemId="g" listType="bulleted">g</paragraph>';

				const selection = prepareTest( model, modelBefore );
				const element = selection.getFirstPosition().nodeAfter;

				model.change( writer => {
					writer.setAttribute( 'listItemId', 'c', element );
					writer.setAttribute( 'listIndent', 2, element );
					writer.setAttribute( 'listType', 'bulleted', element );
					writer.setAttribute( 'listIndent', 2, element.nextSibling );
				} );

				expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup( expectedModel );
			} );
		} );
	} );

	describe( 'multiBlock = false', () => {

	} );
} );

describe( 'DocumentListEditing - registerDowncastStrategy()', () => {
	let editor, model, view;

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'should allow registering strategy for list elements', async () => {
		await createEditor( class CustomPlugin extends Plugin {
			init() {
				this.editor.plugins.get( 'DocumentListEditing' ).registerDowncastStrategy( {
					scope: 'list',
					attributeName: 'someFoo',

					setAttributeOnDowncast( writer, attributeValue, viewElement ) {
						writer.setAttribute( 'data-foo', attributeValue, viewElement );
					}
				} );
			}
		} );

		setModelData( model, modelList( `
			* <paragraph someFoo="123">foo</paragraph>
			* <paragraph someFoo="123">bar</paragraph>
		` ) );

		expect( getViewData( view, { withoutSelection: true } ) ).to.equalMarkup(
			'<ul data-foo="123">' +
				'<li><span class="ck-list-bogus-paragraph">foo</span></li>' +
				'<li><span class="ck-list-bogus-paragraph">bar</span></li>' +
			'</ul>'
		);
	} );

	it( 'should allow registering strategy for list items elements', async () => {
		await createEditor( class CustomPlugin extends Plugin {
			init() {
				this.editor.plugins.get( 'DocumentListEditing' ).registerDowncastStrategy( {
					scope: 'item',
					attributeName: 'someFoo',

					setAttributeOnDowncast( writer, attributeValue, viewElement ) {
						writer.setAttribute( 'data-foo', attributeValue, viewElement );
					}
				} );
			}
		} );

		setModelData( model, modelList( `
			* <paragraph someFoo="123">foo</paragraph>
			* <paragraph someFoo="321">bar</paragraph>
		` ) );

		expect( getViewData( view, { withoutSelection: true } ) ).to.equalMarkup(
			'<ul>' +
				'<li data-foo="123"><span class="ck-list-bogus-paragraph">foo</span></li>' +
				'<li data-foo="321"><span class="ck-list-bogus-paragraph">bar</span></li>' +
			'</ul>'
		);
	} );

	async function createEditor( extraPlugin ) {
		editor = await VirtualTestEditor.create( {
			plugins: [ extraPlugin, Paragraph, DocumentListEditing, UndoEditing ]
		} );

		model = editor.model;
		view = editor.editing.view;
	}
} );