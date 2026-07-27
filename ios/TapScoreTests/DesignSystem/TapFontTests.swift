import SwiftUI
import UIKit
import XCTest
@testable import TapScore

/// Font registration fails SILENTLY: a missing `UIAppFonts` entry, a renamed
/// TTF or a wrong PostScript name all end with UIKit substituting the system
/// face, and the app merely looks a bit off. Nothing in a build catches that,
/// so these tests do.
final class TapFontTests: XCTestCase {
    func testEveryBundledFaceResolvesAtRuntime() {
        for name in TapFont.bundledFaceNames {
            XCTAssertNotNil(
                UIFont(name: name, size: 17),
                "Font \(name) is not registered — check Resources/Fonts/ and UIAppFonts in Info.plist"
            )
        }
    }

    /// The names are the *PostScript* names, not the filenames. Asserted
    /// separately because a `UIFont(name:)` lookup that fell back would already
    /// have failed above — this pins that the resolved face is the one asked
    /// for, not a same-family substitute.
    func testResolvedFaceKeepsItsName() {
        for name in TapFont.bundledFaceNames {
            XCTAssertEqual(UIFont(name: name, size: 17)?.fontName, name)
        }
    }

    func testBothFamiliesArePresent() {
        XCTAssertEqual(TapFont.DisplayWeight.allCases.count, 3, "Fraunces 400/600/700")
        XCTAssertEqual(TapFont.UIWeight.allCases.count, 5, "Archivo 400/500/600/700/800")
        for weight in TapFont.DisplayWeight.allCases {
            XCTAssertTrue(weight.rawValue.hasPrefix("Fraunces-"), weight.rawValue)
        }
        for weight in TapFont.UIWeight.allCases {
            XCTAssertTrue(weight.rawValue.hasPrefix("Archivo-"), weight.rawValue)
        }
    }

    /// The helper that has a failure signal, unlike `Font.custom`.
    func testUIFontHelperReportsAnUnknownFace() {
        XCTAssertNil(TapFont.uiFont("Archivo-NotAWeight", size: 17))
        XCTAssertNotNil(TapFont.uiFont(TapFont.UIWeight.bold.rawValue, size: 17))
    }
}
